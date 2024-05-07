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

-- ADMIN WHITELIST

-- Whitelist of allowed accounts to admin the backend
AdminWhitelist = AdminWhitelist or {
  'P6i7xXWuZtuKJVJYNwEqduj0s8R_G4wZJ38TB5Knpy4',
  'LhsI9POghJ_4WyHGRIzCoRAVFwGdnV8gGPPZyQa5OoE',
  'yqRGaljOLb2IvKkYVa87Wdcc8m_4w6FI58Gej05gorA',
  '4E2br9g8TpsM0YRqUuJlypZ5siradI6m1fTFi-a3mTU'
}

--[[
  Shorthand for readability - use in a handler to ensure the message was sent by a whitelisted account
]]
mod.onlyAdmin = function(msg)
  local isWhitelisted = false
  for _, v in ipairs(AdminWhitelist) do
    if v == msg.From then
      isWhitelisted = true
      break
    end
  end
  assert(isWhitelisted, "Only whitelisted accounts are allowed")
end

mod.addAdmin = function(msg)
  table.insert(AdminWhitelist, msg.Tags.Account)
end

mod.removeAdmin = function(msg)
  for i, v in ipairs(AdminWhitelist) do
    if v == msg.Tags.Account then
      table.remove(AdminWhitelist, i)
      break
    end
  end
end

return mod
