local mod = {}

mod.onlyOwner = function(msg)
  -- TODO msg.From may be another process, while Owner is an entity -> account for these cases
  assert(msg.From == Owner, "Only the owner can withdraw")
end

return mod
