local bot = require "bot.bot"
local ownership = require "ownershipp.ownership"
local validations = require "validationss.validations"
local json = require "json"

-- bot deployment triggered by user from browser => browser wallet owner == process owner
Owner = Owner or ao.env.Process.Owner
-- TODO relatively safe to assume initial balances are 0, but worth discussing :
-- "can ids of not-yet-spawned processes be known in advance and credited?" (for whatever reason)
LatestTargetTokenBal = LatestTargetTokenBal or 0
LatestBaseTokenBal = LatestBaseTokenBal or 0

Initialized = Initialized or false

-- INIT & CONFIG

Handlers.add(
  "status",
  Handlers.utils.hasMatchingTag("Action", "Status"),
  function(msg)
    if not Initialized then
      Handlers.utils.reply(json.encode({ Initialized = false }))(msg)
      return
    end

    -- initialized => reply with complete config
    local config = json.encode({
      Initialized = true,
      TargetToken = TargetToken,
    })
    Handlers.utils.reply(config)(msg)
  end
)

Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    ownership.onlyOwner(msg)
    assert(type(msg.Tags.TargetToken) == 'string', 'Target Token is required!')
    assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')
    assert(type(msg.Tags.SwapAmount) == 'string', 'SwapAmount is required!')
    -- TODO proper input validation
    TargetToken = msg.Tags.TargetToken
    SwapInAmount = msg.Tags.SwapAmount
    Slippage = msg.Tags.Slippage
    Initialized = true
  end
)

-- every handler below this one in the Handlers.list is gated by the Initialized check

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


-- OWNERSHIP

Handlers.add(
  "transferOwnership",
  Handlers.utils.hasMatchingTag("Action", "TransferOwnership"),
  function(msg)
    assert(msg.From == newOwner, 'Only the owner can update the owner!')
    assert(msg.Tags.Owner ~= nil and type(msg.Tags.Owner) == 'string', 'Owner is required!')
    newOwner = msg.Tags.Owner
  end
)

-- DCA

-- to be triggered by dedicated cron proxy
Handlers.add(
  "triggerBuy",
  Handlers.utils.hasMatchingTag("Action", "TriggerBuy"),
  function(msg)
    -- TODO access control -> can this be trusted? or do we need additional checks
    -- like "has the expected time passed, since the last cron tick"
    bot.swapInit()
  end
)

Handlers.add(
  "SwapExec",
  Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
  function(m)
    -- ensure this was a transfer from the bot to the pool as preliminary to the swap
    if m.From ~= BaseToken then return end
    if m.Recipient ~= Pool then return end

    local transferId = m["Pushed-For"]
    bot.swapExec(transferId)
  end
)

-- TRACK latest BARK BALANCE

Handlers.add(
  "BalanceUpdateCredit",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(m)
    if m.From ~= TargetToken then return end
    ao.send({ Target = TargetToken, Action = "Balance" })
  end
)

Handlers.add(
  "BalanceUpdateDebit",
  Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
  function(m)
    if m.From ~= TargetToken then return end
    ao.send({ Target = TargetToken, Action = "Balance" })
  end
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateTargetToken",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == TargetToken
        and m.Account == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestTargetTokenBal = m.Balance
  end
)

-- TRACK latest AoCred BALANCE

Handlers.add(
  "BalanceUpdateCredit",
  Handlers.utils.hasMatchingTag("Action", "Credit-Notice"),
  function(m)
    if m.From ~= BaseToken then return end
    ao.send({ Target = BaseToken, Action = "Balance" })
  end
)

Handlers.add(
  "BalanceUpdateDebit",
  Handlers.utils.hasMatchingTag("Action", "Debit-Notice"),
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
        and m.Account == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestBaseTokenBal = m.Balance
  end
)

-- DCA config

Handlers.add(
  "UpdateDCAIn",
  Handlers.utils.hasMatchingTag("Action", "UpdateDCAIn"),
  function(msg)
    ownership.onlyOwner(msg)
    validations.quantity(msg)
    SwapInAmount = msg.Quantity
  end
)

Handlers.add(
  "UpdateSlippageTolerance",
  Handlers.utils.hasMatchingTag("Action", "UpdateSlippageTolerance"),
  function(msg)
    ownership.onlyOwner(msg)
    validations.quantity(msg)
    SwapInAmount = msg.Tolerance
  end
)

-- Withdrawals

Handlers.add(
  "withdrawTargetToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawTargetToken"),
  function(msg)
    ownership.onlyOwner(msg)
    ownership.optionalQuantity(msg)
    local quantity = msg.Tags.Quantity or LatestTargetTokenBal
    ao.send({
      Target = TargetToken,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = newOwner
    })
  end
)

Handlers.add(
  "WithdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    ownership.onlyOwner(msg)
    ownership.optionalQuantity(msg)
    local quantity = msg.Tags.Quantity or LatestBaseTokenBal
    ao.send({
      Target = BaseToken,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = newOwner
    })
  end
)
