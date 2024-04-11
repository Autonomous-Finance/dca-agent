TargetProcess = TargetProcess or nil

newOwner = newOwner or ao.Process.env.Owner

-- CONFIG

-- TODO ensure initialized before any handler is triggered (catch-all handler)

Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    assert(msg.From == newOwner, 'Only the owner can set the Target Process!')
    assert(type(msg.Tags.TargetProcess) == 'string', 'Target Process Id is required!')
    TargetProcess = msg.Tags.TargetProcess
  end
)

-- OWNERSHIP

Handlers.add(
  "UpdateOwner",
  Handlers.utils.hasMatchingTag("Action", "UpdateOwner"),
  function(msg)
    assert(msg.From == newOwner, 'Only the owner can update the owner!')
    assert(msg.Tags.Owner ~= nil and type(msg.Tags.Owner) == 'string', 'Owner is required!')
    newOwner = msg.Tags.Owner
  end
)

-- TRIGGER

Handlers.add(
  "CronTick",
  Handlers.utils.hasMatchingTag("Action", "Cron"),
  function(msg)
    ao.send({ Target = TargetProcess, Action = "UpdatePrice" })
  end
)
