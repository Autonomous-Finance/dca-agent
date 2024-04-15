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

    AgentName = msg.Tags.AgentName
    BaseToken = msg.Tags.BaseToken
    SwapInAmount = msg.Tags.SwapInAmount
    SwapIntervalValue = msg.Tags.SwapIntervalValue
    SwapIntervalUnit = msg.Tags.SwapIntervalUnit

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
