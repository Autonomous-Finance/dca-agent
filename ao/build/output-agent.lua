do
local _ENV = _ENV
package.preload[ "bot.bot" ] = function( ... ) local arg = _G.arg;
Pool = "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0" -- BARK/aoCRED pool on testnet bark dex

SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil   -- percentage value (22.33 for 22.33%)

SwapExpectedOutput = SwapExpectedOutput or nil -- used to perform swaps, requested before any particular swap

local bot = {}

bot.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

bot.swapInit = function()
  -- prepare swap
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = SwapInAmount,
    Recipient = Pool
  })
end

bot.swapExec = function()
  assert(type(TransferId) == 'string', 'transferId is required!')
  -- swap interaction
  ao.send({
    Target = Pool,
    Action = "Swap",
    Transfer = TransferId,
    Pool = Pool,
    ["Slippage-Tolerance"] = SlippageTolerance or "1",
    ["Expected-Output"] = SwapExpectedOutput,
  })
end


return bot
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
  return function (msg)
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
  return function (msg)
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
-- catch that and set the global RefundError to the error message.
-- We use this to refund the user if anything goes wrong with an
-- interaction that involves incoming transfers (such as swap or
-- provide)
---@param handler HandlerFunction
---@return HandlerFunction
function mod.catchWrapper(handler)
  -- return the wrapped handler
  return function (msg, env)
    -- execute the provided handler
    local status, result = pcall(handler, msg, env)

    -- validate the execution result
    if not status then
      local err = string.gsub(result, "[%w_]*%.lua:%d: ", "")

      -- set the global RefundError variable
      -- this needs to be reset in the refund later
      RefundError = err

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
local validations = require "validations.validations"
local bot = require "bot.bot"
local patterns = require "utils.patterns"
local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.env.Process.Owner

Initialized = Initialized or false
Retired = Retired or false

AgentName = AgentName or ""
QuoteToken = QuoteToken or "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc" -- AOcred on testnet
BaseToken = BaseToken or "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ"   -- BARK on testnet
LatestBaseTokenBal = LatestBaseTokenBal or "0"
LatestQuoteTokenBal = LatestQuoteTokenBal or "0"

Registry = Registry or 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E' -- hardcoded for mvp, universal for all users

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
      baseToken = BaseToken,
      quoteToken = QuoteToken,
      swapInAmount = SwapInAmount,
      swapIntervalValue = SwapIntervalValue,
      swapIntervalUnit = SwapIntervalUnit,
      baseTokenBalance = LatestBaseTokenBal,
      quoteTokenBalance = LatestQuoteTokenBal,
      swapExpectedOutput = SwapExpectedOutput,
      slippageTolerance = SlippageTolerance,
      transferId = TransferId,
      pool = Pool,
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

-- SWAP

-- response to the bot transferring quote token to the pool, in order to prepare the swap
Handlers.add(
  "requestSwapOutputOnDebitNotice",
  Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
  function(m)
    -- ensure this was a transfer from the bot to the pool as preliminary to the swap
    if m.From ~= QuoteToken then return end
    if m.Recipient ~= Pool then return end

    TransferId = m["Pushed-For"]

    ao.send({
      Target = Pool,
      Action = "Get-Price",
      Token = QuoteToken,
      Quantity = SwapInAmount
    })
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil -- the only time we request a price is before a swap
  end,
  function(msg)
    SwapExpectedOutput = msg.Tags.Price
    ao.send({
      Target = ao.id,
      Action = "SelfSignal",
      Data = "Attempt executing swap with trasnferid: " ..
          TransferId .. 'and expected output ' .. SwapExpectedOutput
    })
    bot.swapExec()
  end
)

-- response to successful swap
Handlers.add(
  'orderConfirmation',
  Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation'),
  function(msg)
    ao.send({
      Target = Registry,
      Action = "Swapped",
      ExpectedOutput = SwapExpectedOutput,
      InputAmount = msg.Tags["From-Quantity"],
      ActualOutput = msg.Tags["To-Quantity"],
      ConfirmedAt = tostring(msg.Timestamp)
    })
    SwapExpectedOutput = nil
    TransferId = nil
  end
)

-- FEATURES

local withdrawToken = function(type)
  local Token = type == 'quote' and QuoteToken or BaseToken
  local quantity = type == 'quote' and LatestQuoteTokenBal or LatestBaseTokenBal
  return function(msg)
    ownership.onlyOwner(msg)
    validations.optionalQuantity(msg)
    ao.send({
      Target = Token,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = Owner
    })
  end
end

Handlers.add(
  "withdrawQuoteToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawQuoteToken"),
  withdrawToken('quote')
)

Handlers.add(
  "withdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  withdrawToken('base')
)

-- RETIRE

Handlers.add(
  "Retire",
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
    bot.swapInit()
  end
)
