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

local ownership = require "ownership.ownership"
local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.Process.env.Owner

Initialized = Initialized or false

-- INIT & CONFIG

Handlers.add(
  "status",
  Handlers.utils.hasMatchingTag("Action", "Status"),
  function(msg)
    if not Initialized then
      Handlers.utils.reply({
        ["Response-For"] = "Status",
        Data = json.encode({ initialized = false })
      })(msg)
      return
    end

    -- is initialized => reply with complete config
    local config = json.encode({
      initialized = true,
      targetToken = TargetToken,
    })
    Handlers.utils.reply({
      ["Response-For"] = "Status",
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
    Handlers.utils.reply("Init Success")(msg)
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
)`
