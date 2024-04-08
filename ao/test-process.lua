local ownership = require "ownership.ownership"
local validations = require "validations.validations"
local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.Process.env.Owner

Initialized = Initialized or false

BaseToken = BaseToken or "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"
LatestBaseTokenBal = LatestBaseTokenBal or "0"

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
      targetToken = TargetToken,
      baseTokenBalance = LatestBaseTokenBal
    })
    Handlers.utils.reply({
      ["Response-For"] = "GetStatus",
      Data = config
    })(msg)
  end
)

Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    ownership.onlyOwner(msg)
    Initialized = true
    assert(type(msg.Tags.TargetToken) == 'string', 'Target Token is required!')
    TargetToken = msg.Tags.TargetToken
    Handlers.utils.reply({
      ["Response-For"] = "Initialize",
      Data = "Success"
    })(msg)
  end
)

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
    assert(msg.From == Owner, 'Only the owner can update the owner!')
    assert(msg.Tags.Owner ~= nil and type(msg.Tags.Owner) == 'string', 'Owner is required!')
    Owner = msg.Tags.Owner
    Handlers.utils.reply({
      ["Response-For"] = "TransferOwnership",
      Data = "Success"
    })(msg)
  end
)

-- TRACK latest BaseToken BALANCE

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

-- FEATURES

Handlers.add(
  "WithdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    ownership.onlyOwner(msg)
    validations.optionalQuantity(msg)
    local quantity = msg.Tags.Quantity or LatestBaseTokenBal
    ao.send({
      Target = BaseToken,
      Action = "Transfer",
      Quantity = quantity,
      Recipient = Owner
    })
  end
)
