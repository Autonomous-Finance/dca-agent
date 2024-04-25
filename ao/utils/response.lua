local mod = {}

--[[
  Using this rather than Handlers.utils.reply() in order to have
  the root-level "Data" set to the provided data (as opposed to a "Data" tag)
--]]
function mod.dataReply(tag, data)
  return function(msg)
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = data
    })
  end
end

--[[
  Variant of dataReply that is only sent out for trivial confirmations
  after updates etc.
  Only sends out if Verbose is set to true.
--]]
function mod.success(tag)
  return function(msg)
    if not Verbose then return end
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = "Success"
    })
  end
end

return mod
