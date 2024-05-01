export const AGENT_SOURCE = `do
local _ENV = _ENV
package.preload[ "agent.balances" ] = function( ... ) local arg = _G.arg;
local mod = {}


mod.balanceUpdateCreditQuoteToken = function(msg)
  if msg.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
  if msg.Sender == Pool then return end -- do not register pool refunds as deposits
  ao.send({
    Target = Backend,
    Action = "Deposit",
    Sender = msg.Tags.Sender,
    Quantity = msg.Quantity
  })
end

mod.balanceUpdateDebitQuoteToken = function(msg)
  if msg.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
end


mod.latestBalanceUpdateQuoteToken = function(msg)
  LatestQuoteTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = msg.Balance })
end


mod.balanceUpdateCreditBaseToken = function(msg)
  if msg.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end



mod.balanceUpdateDebitBaseToken = function(msg)
  if msg.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end


mod.latestBalanceUpdateBaseToken = function(msg)
  LatestBaseTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = msg.Balance })
end


return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.life-cycle" ] = function( ... ) local arg = _G.arg;
local response = require "utils.response"

local mod = {}

local validateInitData = function(msg)
  assert(type(msg.Tags.BaseToken) == 'string', 'Base Token is required!')
  assert(type(msg.Tags.QuoteToken) == 'string', 'Quote Token is required!')
  assert(type(msg.Tags.BaseTokenTicker) == 'string', 'Base Token Ticker is required!')
  assert(type(msg.Tags.QuoteTokenTicker) == 'string', 'Quote Token Ticker is required!')
  assert(type(msg.Tags.Pool) == 'string', 'Pool is required!')
  assert(type(msg.Tags.Dex) == 'string', 'Dex is required!')
  assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
  assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
  assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')
  assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')
end

mod.initialize = function(msg)
  Owner = msg.Sender
  assert(not Initialized, 'Process is already initialized')
  Initialized = true

  validateInitData(msg)

  AgentName = msg.Tags.AgentName
  BaseToken = msg.Tags.BaseToken
  QuoteToken = msg.Tags.QuoteToken
  BaseTokenTicker = msg.Tags.BaseTokenTicker
  QuoteTokenTicker = msg.Tags.QuoteTokenTicker
  Pool = msg.Tags.Pool
  Dex = msg.Tags.Dex
  SwapInAmount = msg.Tags.SwapInAmount
  SwapIntervalValue = msg.Tags.SwapIntervalValue
  SwapIntervalUnit = msg.Tags.SwapIntervalUnit
  SlippageTolerance = msg.Tags.Slippage

  response.success("Initialize")(msg)
end

mod.pauseToggle = function(msg)
  Paused = not Paused
  ao.send({ Target = Backend, Action = "PauseToggleAgent", Paused = tostring(Paused) })
  response.success("PauseToggle")(msg)
end

mod.retire = function(msg)
  assert(LatestQuoteTokenBal == "0", 'Quote Token balance must be 0 to retire')
  assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
  Retired = true
  ao.send({ Target = Backend, Action = "RetireAgent" })
  response.success("Retire")(msg)
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.liquidation" ] = function( ... ) local arg = _G.arg;
local mod = {}

local json = require "json"

mod.start = function(msg)
  IsLiquidating = true
  ao.send({
    Target = ao.id,
    Data = "Liquidating. Swapping back..."
  })

  --[[
    we won't rely on latest balances when withdrawing to the owner at the end of the liquidation
    instead we remember quote token balance before the swap back
      => after swap back, we add it to the output quote amount and transfer the whole sum to the owner
    this setup is in order to avoid two separate withdrawals, which would have been the other option
      (one before swap back (HERE), one after the swap back (on quote CREDIT-NOTICE))
  --]]
  LiquidationAmountQuote = LatestQuoteTokenBal
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = LatestBaseTokenBal
  })
end

mod.swapBackExec = function(msg)
  SwapBackExpectedOutput = msg.Tags.Price
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = LatestBaseTokenBal,
    Recipient = Pool,
    ["X-Action"] = "Swap",
    ["X-Slippage-Tolerance"] = SlippageTolerance or "1",
    ["X-Expected-Output"] = SwapBackExpectedOutput,
  })
end

mod.concludeSwapBack = function(msg)
  if (msg.Tags["From-Token"] ~= BaseToken) then return end
  ao.send({
    Target = Backend,
    Action = "SwapBack",
    ExpectedOutput = SwapBackExpectedOutput,
    InputAmount = msg.Tags["From-Quantity"],
    ActualOutput = msg.Tags["To-Quantity"],
    ConfirmedAt = tostring(msg.Timestamp)
  })
  SwapBackExpectedOutput = nil
end

mod.finalizeLiquidation = function(msg)
  if msg.From ~= QuoteToken then return end
  if msg.Sender ~= Pool then return end
  --[[
    Sender == Pool indicates this credit-notice is from either
      A. a pool payout after swap back (last step of the liquidation process)
      OR
      B. refund after failed dca swap
  --]]
  if LiquidationAmountQuote == nil then
    -- this is B. a refund, handled elsewhere
    return
  else
    -- this is A. a payout after swap back
    LiquidationAmountBaseToQuote = msg.Tags["Quantity"]

    ao.send({
      Target = QuoteToken,
      Action = "Transfer",
      Quantity = tostring(math.floor(LiquidationAmountQuote + LiquidationAmountBaseToQuote)),
      Recipient = Owner
    })
    LiquidationAmountQuote = nil
    LiquidationAmountBaseToQuote = nil
    IsLiquidating = false
  end
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.ownership" ] = function( ... ) local arg = _G.arg;
local response = require "utils.response"

local mod = {}

mod.transfer = function(msg)
  local newOwner = msg.Tags.NewOwner
  assert(newOwner ~= nil and type(newOwner) == 'string', 'NewOwner is required!')
  Owner = newOwner
  ao.send({ Target = Backend, Action = "TransferAgent", NewOwner = newOwner })
  response.success("TransferOwnership")(msg)
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.progress" ] = function( ... ) local arg = _G.arg;
local mod = {}

mod.startDepositing = function(msg)
  IsDepositing = true
end

mod.concludeDeposit = function(msg)
  if msg.From ~= QuoteToken or IsLiquidating then return end
  IsDepositing = false
  LastDepositNoticeId = msg.Id
end

mod.concludeWithdraw = function(msg)
  local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
  local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
  if not (isQuoteWithdrawal or isBaseWithdrawal) then return end
  IsWithdrawing = false
  LastWithdrawalNoticeId = msg.Id
end

mod.concludeLiquidation = function(msg)
  local isLiquidation = msg.From == QuoteToken and msg.Recipient == Owner and IsLiquidating
  if not (isLiquidation) then return end
  IsLiquidating = false
  LastLiquidationNoticeId = msg.Id
end

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
mod.resetProgressFlags = function(msg)
  IsWithdrawing = false
  IsDepositing = false
  IsLiquidating = false
  IsSwapping = false
  LastDepositNoticeId = nil
  LastWithdrawalNoticeId = nil
  LastLiquidationNoticeId = nil
  LastSwapNoticeId = nil
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.status" ] = function( ... ) local arg = _G.arg;
local json = require "json"
local response = require "utils.response"

local mod = {}

mod.getStatus = function(msg)
  if not Initialized then
    response.dataReply("GetStatus", json.encode({ initialized = false }))(msg)
    return
  end

  -- is initialized => reply with complete config
  local config = json.encode({
    initialized = true,
    agentName = AgentName,
    retired = Retired,
    paused = Paused,
    baseToken = BaseToken,
    quoteToken = QuoteToken,
    baseTokenTicker = BaseTokenTicker,
    quoteTokenTicker = QuoteTokenTicker,
    swapInAmount = SwapInAmount,
    swapIntervalValue = SwapIntervalValue,
    swapIntervalUnit = SwapIntervalUnit,
    baseTokenBalance = LatestBaseTokenBal,
    quoteTokenBalance = LatestQuoteTokenBal,
    swapExpectedOutput = SwapExpectedOutput,
    swapBackExpectedOutput = SwapBackExpectedOutput,
    slippageTolerance = SlippageTolerance,
    pool = Pool,
    dex = Dex,
    isSwapping = IsSwapping,
    isDepositing = IsDepositing,
    isWithdrawing = IsWithdrawing,
    isLiquidating = IsLiquidating,
    lastDepositNoticeId = LastDepositNoticeId,
    lastWithdrawalNoticeId = LastWithdrawalNoticeId,
    lastLiquidationNoticeId = LastLiquidationNoticeId
  })
  response.dataReply("GetStatus", config)(msg)
end

mod.checkNotBusy = function()
  local flags = json.encode({
    IsSwapping = IsSwapping,
    IsDepositing = IsDepositing,
    IsWithdrawing = IsWithdrawing,
    IsLiquidating = IsLiquidating
  })
  -- LOG
  ao.send({
    Target = ao.id,
    Data = "Checking if busy..." .. flags
  })
  if IsDepositing or IsWithdrawing or IsLiquidating or IsSwapping then
    response.errorMessage(
      "error - process is busy with another action on funds" .. flags
    )()
  end
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.swaps" ] = function( ... ) local arg = _G.arg;
local response = require "utils.response"

SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil           -- percentage value (22.33 for 22.33%)

SwapExpectedOutput = SwapExpectedOutput or nil         -- used to perform swaps, requested before any particular swap
SwapBackExpectedOutput = SwapBackExpectedOutput or nil -- used to perform swaps, requested before any particular swap

local mod = {}

mod.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

-- SWAP

mod.triggerSwap = function()
  assert(not Paused, 'Process is paused')
  IsSwapping = true
  -- request expected swap output
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = QuoteToken,
    Quantity = SwapInAmount
  })
end

mod.swapExec = function(msg)
  SwapExpectedOutput = msg.Tags.Price
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Recipient = Pool,
    Quantity = SwapInAmount,
    ["X-Action"] = "Swap",
    ["X-Slippage-Tolerance"] = SlippageTolerance or "1",
    ["X-Expected-Output"] = SwapExpectedOutput,
  })
end

mod.concludeSwap = function(msg)
  if (msg.Tags["From-Token"] ~= QuoteToken) then return end
  ao.send({
    Target = Backend,
    Action = "Swap",
    ExpectedOutput = SwapExpectedOutput,
    InputAmount = msg.Tags["From-Quantity"],
    ActualOutput = msg.Tags["To-Quantity"],
    ConfirmedAt = tostring(msg.Timestamp)
  })
  SwapExpectedOutput = nil
end

mod.finalizeDCASwap = function(msg)
  if msg.From ~= BaseToken then return end
  if msg.Sender ~= Pool then return end

  IsSwapping = false
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "agent.withdrawals" ] = function( ... ) local arg = _G.arg;
local mod = {}

mod.withdrawQuoteToken = function(msg)
  IsWithdrawing = true
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

mod.withdrawBaseToken = function(msg)
  IsWithdrawing = true
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "permissions.permissions" ] = function( ... ) local arg = _G.arg;
local mod = {}

--[[
  Shorthand for readability - use in a handler to ensure the message was sent by the process owner
]]
---@param msg Message
mod.onlyOwner = function(msg)
  assert(msg.From == Owner, "Only the owner is allowed")
end

--[[
  Shorthand for readability - use in a handler to ensure the message was sent by a registered agent
]]
---@param msg Message
mod.onlyAgent = function(msg)
  assert(RegisteredAgents[msg.From] ~= nil, "Only a registered agent is allowed")
end
return mod
end
end

do
local _ENV = _ENV
package.preload[ "utils.patterns" ] = function( ... ) local arg = _G.arg;
local mod = {}

-- This function allows the wrapped pattern function
-- to continue the execution after the handler
---@param fn fun(msg: Message)
---@return PatternFunction
function mod.continue(fn)
  return function(msg)
    local patternResult = fn(msg)

    if not patternResult or patternResult == 0 or patternResult == "skip" then
      return patternResult
    end
    return 1
  end
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "utils.response" ] = function( ... ) local arg = _G.arg;
local mod = {}

--[[
  Using this rather than Handlers.utils.reply() in order to have
  the root-level "Data" set to the provided data (as opposed to a "Data" tag)
]]
---@param tag string Tag name
---@param data any Data to be sent back
function mod.dataReply(tag, data)
  return function(msg)
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = data
    })
  end
end

--[[
  Variant of dataReply that is only sent out for trivial confirmations
  after updates etc.
  Only sends out if global Verbose is set to true.
]]
---@param tag string Tag name
function mod.success(tag)
  return function(msg)
    if not Verbose then return end
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = "Success"
    })
  end
end

function mod.errorMessage(text)
  return function()
    error({
      message = text
    })
  end
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "validations.validations" ] = function( ... ) local arg = _G.arg;
local bint = require('.bint')(256)

local mod = {}

mod.quantity = function(msg)
  assert(type(msg.Quantity) == 'string', 'Quantity is required!')
  local qty = bint(msg.Quantity)
  assert(qty > 0, 'Quantity must be positive')
end


mod.optionalQuantity = function(msg)
  if msg.Quantity == nil then return end

  mod.quantity(msg)
end

return mod
end
end

local json = require "json"

local permissions = require "permissions.permissions"
local lifeCycle = require "agent.life-cycle"
local status = require "agent.status"
local swaps = require "agent.swaps"
local withdrawals = require "agent.withdrawals"
local liquidation = require "agent.liquidation"
local balances = require "agent.balances"
local progress = require "agent.progress"
local ownership = require "agent.ownership"
local patterns = require "utils.patterns"
local response = require "utils.response"

-- set to false in order to disable sending out success confirmation messages
Verbose = Verbose or true

Initialized = Initialized or false
Retired = Retired or false
Paused = Paused or false

AgentName = AgentName or ""
QuoteToken = QuoteToken or ""
BaseToken = BaseToken or ""
QuoteTokenTicker = QuoteTokenTicker or ""
BaseTokenTicker = BaseTokenTicker or ""

Pool = Pool or ""
Dex = Dex or ""

LatestBaseTokenBal = LatestBaseTokenBal or "0"
LatestQuoteTokenBal = LatestQuoteTokenBal or "0"
LiquidationAmountQuote = LiquidationAmountQuote or nil
LiquidationAmountBaseToQuote = LiquidationAmountBaseToQuote or nil

Backend = Backend or 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E' -- hardcoded for mvp, universal for all users

-- flags for helping the frontend properly display the process status
IsSwapping = IsSwapping or false
IsWithdrawing = IsWithdrawing or false
IsDepositing = IsDepositing or false
IsLiquidating = IsLiquidating or false
LastWithdrawalNoticeId = LastWithdrawalNoticeId or nil
LastDepositNoticeId = LastDepositNoticeId or nil
LastLiquidationNoticeId = LastLiquidationNoticeId or nil

-- LIFE CYCLE & CONFIG

Handlers.add(
  "getOwner",
  Handlers.utils.hasMatchingTag("Action", "GetOwner"),
  function(msg)
    response.dataReply("GetOwner", Owner)(msg)
  end
)

Handlers.add(
  "getStatus",
  Handlers.utils.hasMatchingTag("Action", "GetStatus"),
  status.getStatus
)

-- msg to be sent by end user
Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  lifeCycle.initialize
)

-- ! every handler below is gated on Initialized == true
Handlers.add(
  "checkInit",
  function(msg)
    return not Initialized
  end,
  response.errorMessage("error - process is not initialized")
)

-- ! every handler below is gated on Retired == false
Handlers.add(
  "checkRetired",
  function(msg)
    return Retired
  end,
  response.errorMessage("error - process is retired")
)

Handlers.add(
  "pauseToggle",
  Handlers.utils.hasMatchingTag("Action", "PauseToggle"),
  function(msg)
    permissions.onlyOwner(msg)
    lifeCycle.pauseToggle(msg)
  end
)

Handlers.add(
  "retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    permissions.onlyOwner(msg)
    lifeCycle.retire(msg)
  end
)

-- OWNERSHIP

Handlers.add(
  "transferOwnership",
  Handlers.utils.hasMatchingTag("Action", "TransferOwnership"),
  function(msg)
    permissions.onlyOwner(msg)
    ownership.transfer(msg)
  end
)

-- TRACK BALANCES -- ! keep these handlers here at the top of the file (because continue patterns)

Handlers.add(
  "balanceUpdateCreditQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  balances.balanceUpdateCreditQuoteToken
)

Handlers.add(
  "balanceUpdateDebitQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  balances.balanceUpdateDebitQuoteToken
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateQuoteToken",
  function(msg)
    local isMatch = msg.Tags.Balance ~= nil
        and msg.From == QuoteToken
        and msg.Target == ao.id
    return isMatch and -1 or 0
  end,
  balances.latestBalanceUpdateQuoteToken
)

Handlers.add(
  "balanceUpdateCreditBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  balances.balanceUpdateCreditBaseToken
)

Handlers.add(
  "balanceUpdateDebitBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  balances.balanceUpdateDebitBaseToken
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateBaseToken",
  function(msg)
    local isMatch = msg.Tags.Balance ~= nil
        and msg.From == BaseToken
        and msg.Target == ao.id
    return isMatch and -1 or 0
  end,
  balances.latestBalanceUpdateBaseToken
)

-- --------------------------------------

-- PROGRESS FLAGS

Handlers.add(
  "startDepositing",
  Handlers.utils.hasMatchingTag("Action", "StartDepositing"),
  progress.startDepositing
)

Handlers.add(
  "concludeDeposit",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  progress.concludeDeposit
)

Handlers.add(
  "concludeWithdraw",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  progress.concludeWithdraw
)

Handlers.add(
  "concludeLiquidation",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  progress.concludeLiquidation
)

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
Handlers.add(
  'resetProgressFlags',
  Handlers.utils.hasMatchingTag('Action', 'ResetProgressFlags'),
  progress.resetProgressFlags
)

-- --------------------------------------

-- SWAP (DCA)

Handlers.add(
  "triggerSwap",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwap"),
  function(msg)
    if not msg.Cron then return end
    -- LOG
    ao.send({ Target = ao.id, Action = "Log-TriggerSwap" })
    status.checkNotBusy()
    swaps.triggerSwap()
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool
        and msg.Tags.Price ~= nil
        and IsSwapping -- would rather use msg.Tags.Token == QuoteToken but AMM does not provide it when responding to Get-Price
  end,
  swaps.swapExec
)

-- token could not transfer to pool (insufficient balance)
Handlers.add(
  'swapErrorByToken',
  patterns.continue(function(msg)
    return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
        and msg.From == QuoteToken
        and IsSwapping
  end),
  function(msg)
    IsSwapping = false
  end
)

-- pool could not fulfill the swap (misc errors possible - REFUND TRANSFER)
Handlers.add(
  'swapErrorByPool',
  patterns.continue(function(msg)
    return Handlers.utils.hasMatchingTag('Action', 'Credit-Notice')(msg)
        and msg.From == QuoteToken
        and msg.Sender == Pool
        and msg.Tags["X-Refunded-Transfer"] ~= nil
  end),
  function(msg)
    ao.send({ Target = ao.id, Data = "Refund after failed DCA swap : " .. json.encode(msg) })
    IsSwapping = false
  end
)

-- response to successful swap
Handlers.add(
  'orderConfirmation',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  swaps.concludeSwap
)

-- last step of the dca swap process
Handlers.add(
  "finalizeSwap",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  swaps.finalizeDCASwap
)

-- SWAP BACK (in order to LIQUIDATE)

-- response to the price request for SWAP BACK
Handlers.add(
  'swapBackExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool
        and msg.Tags.Price ~= nil
        and
        IsLiquidating -- would rather use msg.Tags.Token == BaseToken but AMM does not provide it when responding to Get-Price
  end,
  liquidation.swapBackExec
)

-- token could not transfer to pool (insufficient balance)
Handlers.add(
  'swapBackErrorByToken',
  patterns.continue(function(msg)
    return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
        and msg.From == BaseToken
        and IsLiquidating
  end),
  function(msg)
    IsLiquidating = false
  end
)

-- pool could not fulfill the swap (misc errors possible - REFUND TRANSFER)
Handlers.add(
  'swapBackErrorByPool',
  patterns.continue(function(msg)
    return Handlers.utils.hasMatchingTag('Action', 'Credit-Notice')(msg)
        and msg.From == BaseToken
        and msg.Sender == Pool
        and msg.Tags["X-Refunded-Transfer"] ~= nil
  end),
  function(msg)
    ao.send({ Target = ao.id, Data = "Refund after failed swap back: " .. json.encode(msg) })
    IsLiquidating = false
  end
)

-- response to successful SWAP BACK
Handlers.add(
  'orderConfirmationSwapBack',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  liquidation.concludeSwapBack
)

-- last step of the liquidation process
Handlers.add(
  "withdrawAfterSwapBack",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  liquidation.finalizeLiquidation
)

-- token could not transfer to agent owner (insufficient balance)
Handlers.add(
  'withdrawError',
  patterns.continue(function(msg)
    return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
        and (msg.From == QuoteToken or msg.From == BaseToken)
        and IsWithdrawing
  end),
  function(msg)
    IsWithdrawing = false
  end
)

-- WITHDRAW

Handlers.add(
  "withdrawQuoteToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawQuoteToken"),
  function(msg)
    permissions.onlyOwner(msg)
    status.checkNotBusy()
    withdrawals.withdrawQuoteToken(msg)
  end
)

Handlers.add(
  "withdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    permissions.onlyOwner(msg)
    status.checkNotBusy()
    withdrawals.withdrawBaseToken(msg)
  end
)

-- LIQUIDATION

Handlers.add(
  "liquidate",
  Handlers.utils.hasMatchingTag("Action", "Liquidate"),
  function(msg)
    permissions.onlyOwner(msg)
    status.checkNotBusy()
    liquidation.start(msg)
  end
)

-- MISC CONFIGURATION

Handlers.add(
  "setVerbose",
  Handlers.utils.hasMatchingTag("Action", "SetVerbose"),
  function(msg)
    permissions.onlyOwner(msg)
    Verbose = msg.Tags.Verbose
    response.success("SetVerbose")(msg)
  end
)

-- DEBUG / DEV

Handlers.add(
  "triggerSwapDebug",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwapDebug"),
  function(msg)
    permissions.onlyOwner(msg)
    status.checkNotBusy()
    swaps.triggerSwap()
  end
)

Handlers.add(
  "getFlags",
  Handlers.utils.hasMatchingTag("Action", "GetFlags"),
  function(msg)
    response.dataReply("GetFlags", json.encode({
      IsSwapping = IsSwapping,
      IsWithdrawing = IsWithdrawing,
      IsDepositing = IsDepositing,
      IsLiquidating = IsLiquidating
    }))(msg)
  end
)`
