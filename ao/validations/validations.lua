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
