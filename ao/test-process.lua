local ownership = require "ownership.ownership"

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


-- FEATURES

Handlers.add(
  "name",
  Handlers.utils.hasMatchingTag("Action", "Name"),
  function(msg)
    ownership.onlyOwner(msg)
    Handlers.utils.reply("My Name is P")(msg)
  end
)
