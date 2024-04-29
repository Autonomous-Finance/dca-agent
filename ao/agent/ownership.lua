local response = require "utils.response"

local mod = {}

mod.transfer = function(msg)
  local newOwner = msg.Tags.NewOwner
  assert(newOwner ~= nil and type(newOwner) == 'string', 'NewOwner is required!')
  Owner = newOwner
  ao.send({ Target = Backend, Action = "TransferAgent", NewOwner = newOwner })
  response.success("TransferOwnership")(msg)
end

return mod
