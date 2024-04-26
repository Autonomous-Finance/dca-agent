do
local _ENV = _ENV
package.preload[ "agent.agent" ] = function( ... ) local arg = _G.arg;
Pool = "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0" -- BARK/aoCRED pool on testnet bark dex

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

mod.requestSwapOutput = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = QuoteToken,
    Quantity = SwapInAmount
  })
end

mod.swap = function()
  -- prepare swap
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

mod.requestSwapBackOutput = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = LatestBaseTokenBal
  })
end


mod.swapBack = function()
  -- prepare swap back
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

return mod
end
end

do
local _ENV = _ENV
package.preload[ "ownership.ownership" ] = function( ... ) local arg = _G.arg;
local mod = {}

-- messages that are to pass this access control check
-- should be sent by a wallet (entity), not by another process

mod.onlyOwner = function(msg)
  assert(msg.From == Owner, "Only the owner is allowed")
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

-- The "hasMatchingTag" utility function, but it supports
-- multiple values for the tag
---@param name string Tag name
---@param values string[] Tag values
---@return PatternFunction
function mod.hasMatchingTagOf(name, values)
  return function(msg)
    for _, value in ipairs(values) do
      local patternResult = Handlers.utils.hasMatchingTag(name, value)(msg)

      if patternResult ~= 0 then
        return patternResult
      end
    end

    return 0
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperSwap(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      SwapError = err

      return nil
    end

    return result
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperSwapBack(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      SwapBackError = err

      return nil
    end

    return result
  end
end

-- Handlers wrapped with this function will not throw Lua errors.
-- Instead, if the handler throws an error, the wrapper will
-- catch that and set the global SwapError to the error message.
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapperLiquidate(handler)
  -- return the wrapped handler
  return function(msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      LiquidateError = err

      return nil
    end

    return result
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

local ownership = require "ownership.ownership"
local agent = require "agent.agent"
local patterns = require "utils.patterns"
local json = require "json"

-- agent deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.env.Process.Owner

Initialized = Initialized or false
Retired = Retired or false
Paused = Paused or false

AgentName = AgentName or ""
QuoteToken = QuoteToken or "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc" -- AOcred on testnet
BaseToken = BaseToken or "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ"   -- BARK on testnet
LatestBaseTokenBal = LatestBaseTokenBal or "0"
LatestQuoteTokenBal = LatestQuoteTokenBal or "0"
LiquidationAmountQuote = LiquidationAmountQuote or nil
LiquidationAmountBaseToQuote = LiquidationAmountBaseToQuote or nil

Registry = Registry or 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E' -- hardcoded for mvp, universal for all users

-- flags for helping the frontend properly display the process status
IsSwapping = IsSwapping or false
IsWithdrawing = IsWithdrawing or false
IsDepositing = IsDepositing or false
IsLiquidating = IsLiquidating or false
LastWithdrawalNoticeId = LastWithdrawalNoticeId or nil
LastDepositNoticeId = LastDepositNoticeId or nil
LastLiquidationNoticeId = LastLiquidationNoticeId or nil

-- INIT & CONFIG

Handlers.add(
  "getOwner",
  Handlers.utils.hasMatchingTag("Action", "GetOwner"),
  function(msg)
    Handlers.utils.reply({
      ["Response-For"] = "GetOwner",
      Data = Owner
    })(msg)
  end
)

Handlers.add(
  "getStatus",
  Handlers.utils.hasMatchingTag("Action", "GetStatus"),
  function(msg)
    if not Initialized then
      Handlers.utils.reply({
        ["Response-For"] = "GetStatus",
        Data = json.encode({ initialized = false })
      })(msg)
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
      swapInAmount = SwapInAmount,
      swapIntervalValue = SwapIntervalValue,
      swapIntervalUnit = SwapIntervalUnit,
      baseTokenBalance = LatestBaseTokenBal,
      quoteTokenBalance = LatestQuoteTokenBal,
      swapExpectedOutput = SwapExpectedOutput,
      swapBackExpectedOutput = SwapBackExpectedOutput,
      slippageTolerance = SlippageTolerance,
      pool = Pool,
      isSwapping = IsSwapping,
      isDepositing = IsDepositing,
      isWithdrawing = IsWithdrawing,
      isLiquidating = IsLiquidating,
      lastDepositNoticeId = LastDepositNoticeId,
      lastWithdrawalNoticeId = LastWithdrawalNoticeId,
      lastLiquidationNoticeId = LastLiquidationNoticeId
    })
    Handlers.utils.reply({
      ["Response-For"] = "GetStatus",
      Data = config
    })(msg)
  end
)

-- msg to be sent by end user
Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    ownership.onlyOwner(msg)
    -- initialize Controller, too
    -- Controller = msg.Tags.Controller
    assert(not Initialized, 'Process is already initialized')
    Initialized = true
    assert(type(msg.Tags.BaseToken) == 'string', 'Base Token is required!')
    assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
    assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
    assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')
    assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')

    AgentName = msg.Tags.AgentName
    BaseToken = msg.Tags.BaseToken
    SwapInAmount = msg.Tags.SwapInAmount
    SwapIntervalValue = msg.Tags.SwapIntervalValue
    SwapIntervalUnit = msg.Tags.SwapIntervalUnit
    SlippageTolerance = msg.Tags.Slippage

    Handlers.utils.reply({
      ["Response-For"] = "Initialize",
      Data = "Success"
    })(msg)
  end
)

-- every handler below is gated on Initialized == true
Handlers.add(
  "checkInit",
  function(msg)
    return not Initialized
  end,
  function(msg)
    error({
      message = "error - process is not initialized"
    })
  end
)

-- every handler below is gated on Retired == false
Handlers.add(
  "checkRetired",
  function(msg)
    return Retired
  end,
  function(msg)
    error({
      message = "error - process is retired"
    })
  end
)

-- OWNERSHIP

Handlers.add(
  "transferOwnership",
  Handlers.utils.hasMatchingTag("Action", "TransferOwnership"),
  function(msg)
    local newOwner = msg.Tags.NewOwner
    assert(newOwner ~= nil and type(newOwner) == 'string', 'NewOwner is required!')
    Owner = newOwner
    ao.send({ Target = Registry, Action = "TransferAgent", NewOwner = newOwner })
    Handlers.utils.reply({
      ["Response-For"] = "TransferOwnership",
      Data = "Success"
    })(msg)
  end
)

-- TRACK latest QuoteToken BALANCE -- ! keep these handlers here at the top of the file (continue patterns)

Handlers.add(
  "balanceUpdateCreditQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
    if m.From ~= QuoteToken then return end
    ao.send({ Target = QuoteToken, Action = "Balance" })
    if m.Sender == Pool then return end -- do not register pool refunds as deposits
    ao.send({
      Target = Registry,
      Action = "Deposited",
      Sender = m.Tags.Sender,
      Quantity = m.Quantity
    })
  end
)

Handlers.add(
  "balanceUpdateDebitQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    if m.From ~= QuoteToken then return end
    ao.send({ Target = QuoteToken, Action = "Balance" })
  end
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateQuoteToken",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == QuoteToken
        and m.Target == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestQuoteTokenBal = m.Balance
    ao.send({ Target = Registry, Action = "UpdateQuoteTokenBalance", Balance = m.Balance })
  end
)

-- TRACK latest BASE TOKEN BALANCE -- ! keep these handlers here at the top of the file (continue patterns)

Handlers.add(
  "balanceUpdateCreditBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
    if m.From ~= BaseToken then return end
    ao.send({ Target = BaseToken, Action = "Balance" })
  end
)

Handlers.add(
  "balanceUpdateDebitBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    if m.From ~= BaseToken then return end
    ao.send({ Target = BaseToken, Action = "Balance" })
  end
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateBaseToken",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == BaseToken
        and m.Target == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestBaseTokenBal = m.Balance
    ao.send({ Target = Registry, Action = "UpdateBaseTokenBalance", Balance = m.Balance })
  end
)

-- PROCESS IN PROGRESS FLAGS

Handlers.add(
  "startDepositing",
  Handlers.utils.hasMatchingTag("Action", "StartDepositing"),
  function(msg)
    IsDepositing = true
  end
)

Handlers.add(
  "concludeDeposit",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(msg)
    if msg.From ~= QuoteToken or IsLiquidating then return end
    IsDepositing = false
    LastDepositNoticeId = msg.Id
  end
)

Handlers.add(
  "concludeWithdraw",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(msg)
    local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
    local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
    if not (isQuoteWithdrawal or isBaseWithdrawal) then return end
    IsWithdrawing = false
    LastWithdrawalNoticeId = msg.Id
  end
)

Handlers.add(
  "concludeLiquidation",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(msg)
    local isLiquidation = msg.From == QuoteToken and msg.Recipient == Owner and IsLiquidating
    if not (isLiquidation) then return end
    IsLiquidating = false
    LastLiquidationNoticeId = msg.Id
  end
)

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
Handlers.add(
  'resetProcessFlags',
  Handlers.utils.hasMatchingTag('Action', 'ResetProcessFlags'),
  function(msg)
    IsWithdrawing = false
    IsDepositing = false
    IsLiquidating = false
    LastDepositNoticeId = nil
    LastWithdrawalNoticeId = nil
    LastLiquidationNoticeId = nil
  end
)

-- SWAP

Handlers.add(
  "triggerSwap",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwap"),
  function(msg)
    if not msg.Cron then return end
    assert(not Paused, 'Process is paused')
    ao.send({ Target = ao.id, Data = "TICK RECEIVED" })
    -- IsSwapping = true
    -- agent.requestSwapOutput()
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsSwapping
  end,
  function(msg)
    SwapExpectedOutput = msg.Tags.Price
    agent.swap()
  end
)

-- response to successful swap
Handlers.add(
  'orderConfirmation',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  function(msg)
    if (msg.Tags["From-Token"] ~= QuoteToken) then return end
    ao.send({
      Target = Registry,
      Action = "Swapped",
      ExpectedOutput = SwapExpectedOutput,
      InputAmount = msg.Tags["From-Quantity"],
      ActualOutput = msg.Tags["To-Quantity"],
      ConfirmedAt = tostring(msg.Timestamp)
    })
    SwapExpectedOutput = nil
    IsSwapping = false
  end
)

-- SWAP BACK (TO LIQUIDATE)

-- response to the price request for SWAP BACK
Handlers.add(
  'swapBackExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsLiquidating
  end,
  function(msg)
    SwapBackExpectedOutput = msg.Tags.Price
    agent.swapBack()
  end
)

-- response to successful SWAP BACK
Handlers.add(
  'orderConfirmationSwapBack',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  function(msg)
    if (msg.Tags["From-Token"] ~= BaseToken) then return end
    ao.send({
      Target = Registry,
      Action = "SwappedBack",
      ExpectedOutput = SwapBackExpectedOutput,
      InputAmount = msg.Tags["From-Quantity"],
      ActualOutput = msg.Tags["To-Quantity"],
      ConfirmedAt = tostring(msg.Timestamp)
    })
    SwapBackExpectedOutput = nil
  end
)

-- last step of the liquidation process
Handlers.add(
  "withdrawAfterSwapBack",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
    if m.From ~= QuoteToken then return end
    if m.Sender ~= Pool then return end
    --[[
      Sender == Pool indicates this credit-notice is from either
        A. a pool payout after swap back (last step of the liquidation process)
        OR
        B. refund after failed dca swap
    --]]
    if LiquidationAmountQuote == nil then
      -- this is B. a refund
      ao.send({ Target = ao.id, Data = "Refund after failed DCA swap : " .. json.encode(m) })
      return
    else
      -- this is A. a payout after swap back
      LiquidationAmountBaseToQuote = m.Tags["Quantity"]

      ao.send({
        Target = QuoteToken,
        Action = "Transfer",
        Quantity = tostring(math.floor(LiquidationAmountQuote + LiquidationAmountBaseToQuote)),
        Recipient = Owner
      })
      LiquidationAmountQuote = nil
      LiquidationAmountBaseToQuote = nil
    end
  end
)

-- WITHDRAW

Handlers.add(
  "withdrawQuoteToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawQuoteToken"),
  function(msg)
    ownership.onlyOwner(msg)
    IsWithdrawing = true
    ao.send({
      Target = QuoteToken,
      Action = "Transfer",
      Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
      Recipient = Owner
    })
  end
)

Handlers.add(
  "withdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    ownership.onlyOwner(msg)
    IsWithdrawing = true
    ao.send({
      Target = BaseToken,
      Action = "Transfer",
      Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
      Recipient = Owner
    })
  end
)

-- LIQUIDATE

Handlers.add(
  "liquidate",
  Handlers.utils.hasMatchingTag("Action", "Liquidate"),
  function(msg)
    ownership.onlyOwner(msg)
    IsLiquidating = true
    ao.send({ Target = ao.id, Data = "Liquidating. Swapping back..." })
    --[[
      we won't rely on latest balances when withdrawing to the owner at the end of the liquidation
      instead we remember quote token balance before the swap back
        => after swap back, we add it to the output quote amount and transfer the whole sum to the owner
      this setup is in order to avoid two separate withdrawals, which would have been the other option
        (one before swap back (HERE), one after the swap back (on quote CREDIT-NOTICE))
    --]]
    LiquidationAmountQuote = LatestQuoteTokenBal
    agent.requestSwapBackOutput()
  end
)

-- PAUSE

Handlers.add(
  "pauseToggle",
  Handlers.utils.hasMatchingTag("Action", "PauseToggle"),
  function(msg)
    ownership.onlyOwner(msg)
    Paused = ~Paused
    ao.send({ Target = Registry, Action = "PauseToggleAgent", Paused = tostring(Paused) })
    Handlers.utils.reply({
      ["Response-For"] = "PauseToggle",
      Data = "Success"
    })(msg)
  end
)

-- RETIRE

Handlers.add(
  "retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    ownership.onlyOwner(msg)
    assert(LatestQuoteTokenBal == "0", 'Quote Token balance must be 0 to retire')
    assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
    Retired = true
    ao.send({ Target = Registry, Action = "RetireAgent" })
    Handlers.utils.reply({
      ["Response-For"] = "Retire",
      Data = "Success"
    })(msg)
  end
)

-- DEBUG / DEV

Handlers.add(
  "triggerSwapDebug",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwapDebug"),
  function(msg)
    if msg.From ~= ao.id then
      ownership.onlyOwner(msg)
    end
    ao.send({ Target = ao.id, Data = "SWAP DEBUG from msg: " .. json.encode(msg) })
    IsSwapping = true
    agent.requestSwapOutput()
  end
)
