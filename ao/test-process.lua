local ownership = require "ownership.ownership"

local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.Process.env.Owner

Initialized = Initialized or false

-- INIT & CONFIG

Handlers.add(
  "initStatus",
  Handlers.utils.hasMatchingTag("Action", "InitStatus"),
  function(msg)
    Handlers.utils.reply('Initialized: ' .. tostring(Initialized))(msg)
  end
)

Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    ownership.onlyOwner(msg)
    Initialized = true
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

-- Handlers.add(
--   "setConfig",
--   Handlers.utils.hasMatchingTag("Action", "SetConfig"),
--   function(msg)
--     ownership.onlyOwner(msg)
--     assert(type(msg.Tags.TargetToken) == 'string', 'Target Token is required!')
--     TargetToken = msg.Tags.TargetToken
--   end
-- )

-- Handlers.add(
--   "getConfig",
--   Handlers.utils.hasMatchingTag("Action", "GetConfig"),
--   function(msg)
--     ownership.onlyOwner(msg)
--     local config = json.encode({
--       TargetToken = TargetToken,
--     })
--     Handlers.utils.reply(config)(msg)
--   end
-- )

-- FEATURES
