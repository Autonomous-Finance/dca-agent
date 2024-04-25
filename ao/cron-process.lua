Handlers.add("triggerSwap",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwap"),
  function(msg)
    if not msg.Cron then return end
    ao.send({ Target = ao.env.Process.Tags["Owner"], Action = "TriggerSwap" })
  end
)
