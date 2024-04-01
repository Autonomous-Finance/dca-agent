-- A DCA bot that swaps TargetToken for BaseToken at regular intervals
-- works in conjunction with 2 Cron process proxies
-- (1 for triggering the swap, 1 for updating the price)

-- direct interaction with pool, no router
-- single owner (initially the deployment signer, but can be changed),
-- single currency pair

-- allows loading up with base token
-- allows withdrawals of base or target token
-- allow for total liquidation (return all in base token)

-- target token, slippage, swapAmount are configured only once @ initialization
-- base token can't be configured


local bot = require ".bot.bot"
local ownership = require ".ownership.ownership"
local validations = require ".validations.validations"

-- bot deployment triggered by user from browser => browser wallet owner == process owner
Owner = Owner or ao.Process.env.Owner
LatestTargetTokenBal = LatestTargetTokenBal or nil
LatestBaseTokenBal = LatestBaseTokenBal or nil


-- CONFIG

-- TODO ensure initialized before any handler is triggered (catch-all handler)

Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    assert(msg.From == Owner, 'Only the owner can set the Token!')
    assert(type(msg.Tags.TargetToken) == 'string', 'Target Token is required!')
    assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')
    assert(type(msg.Tags.SwapAmount) == 'string', 'SwapAmount is required!')
    -- TODO proper input validation
    TargetToken = msg.Tags.TargetToken
    SwapInAmount = msg.Tags.SwapAmount
    Slippage = msg.Tags.Slippage
  end
)

-- OWNERSHIP

Handlers.add(
  "updateOwner",
  Handlers.utils.hasMatchingTag("Action", "UpdateOwner"),
  function(msg)
    assert(msg.From == Owner, 'Only the owner can update the owner!')
    assert(msg.Tags.Owner ~= nil and type(msg.Tags.Owner) == 'string', 'Owner is required!')
    Owner = msg.Tags.Owner
  end
)

-- DCA

-- to be riggered by dedicated cron
Handlers.add(
  "updatePrice",
  Handlers.utils.hasMatchingTag("Action", "UpdatePrice"),
  bot.updatePrice()
)

-- to be triggered by dedicated cron proxy
Handlers.add(
  "triggerBuy",
  Handlers.utils.hasMatchingTag("Action", "TriggerBuy"),
  function(msg)
    -- TODO access control -> can this be trusted? or do we need additional checks
    -- like "has the expected time passed, since the last cron tick"
    bot.SwapInit()
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
    bot.SwapExec(transferId)
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

Handlers.add(
  "LatestBalanceUpdate",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == TargetToken
        and m.Account == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestBarkBalance = m.Balance
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

Handlers.add(
  "LatestBalanceUpdate",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == BaseToken
        and m.Account == ao.id
    return isMatch and -1 or 0
  end,
  function(m)
    LatestAoCredBalance = m.Balance
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
  "WithdrawBark",
  Handlers.utils.hasMatchingTag("Action", "Withdraw"),
  function(msg)
    ownership.onlyOwner(msg)
    ownership.optionalQuantity(msg)
    local quantity = msg.Tags.Quantity or LatestBarkBalance
    ao.send({
      Target = TargetToken,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = Owner
    })
  end
)

Handlers.add(
  "WithdrawAoCred",
  Handlers.utils.hasMatchingTag("Action", "Withdraw"),
  function(msg)
    ownership.onlyOwner(msg)
    ownership.optionalQuantity(msg)
    local quantity = msg.Tags.Quantity or LatestAoCredBalance
    ao.send({
      Target = BaseToken,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = Owner
    })
  end
)
