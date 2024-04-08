export const BOT_SOURCE = `do
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
local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.Process.env.Owner

Initialized = Initialized or false
Retired = Retired or false

BaseToken = BaseToken or "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"
LatestBaseTokenBal = LatestBaseTokenBal or "0"
LatestTargetTokenBal = LatestTargetTokenBal or "0"

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
      retired = Retired,
      targetToken = TargetToken,
      baseTokenBalance = LatestBaseTokenBal,
      targetTokenBalance = LatestTargetTokenBal
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
    assert(not Initialized, 'Process is already initialized')
    Initialized = true
    assert(type(msg.Tags.TargetToken) == 'string', 'Target Token is required!')
    TargetToken = msg.Tags.TargetToken
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
    assert(msg.Tags.NewOwner ~= nil and type(msg.Tags.NewOwner) == 'string', 'Owner is required!')
    Owner = msg.Tags.NewOwner
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

-- RETIRE

Handlers.add(
  "Retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    ownership.onlyOwner(msg)
    assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
    assert(LatestTargetTokenBal == "0", 'Target Token balance must be 0 to retire')
    Retired = true
    Handlers.utils.reply({
      ["Response-For"] = "Retire",
      Data = "Success"
    })(msg)
  end
)`
