local mod = {}

mod.onlyOwner = function(msg)
  assert(msg.From == Owner, "Only the owner can withdraw")
end

return mod
