local mod = {}

--[[
  Shorthand for readability - use in a handler to ensure the message was sent by the process owner
]]
---@param msg Message
mod.onlyOwner = function(msg)
  assert(msg.From == Owner, "Only the owner is allowed")
end

--[[
  Shorthand for readability - use in a handler to ensure the message was sent by a registered agent
]]
---@param msg Message
mod.onlyAgent = function(msg)
  assert(RegisteredAgents[msg.From] ~= nil, "Only a registered agent is allowed")
end
return mod
