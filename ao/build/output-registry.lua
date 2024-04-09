do
local _ENV = _ENV
package.preload[ "ownership.ownership" ] = function( ... ) local arg = _G.arg;
local mod = {}

-- messages that are to pass this access control check
-- should be sent by a wallet (entity), not by another process

mod.onlyOwner = function(msg)
  assert(msg.From == Owner, "Only the owner is allowed")
end

return mod
end
end

--[[
  This code relates to a process that tracks existing AF DCA agent and their activity
  The purpose of the tracker process is to facilitate queries regarding the current state and history of any AF DCA agent

  Process is deployed once per dApp in MVP


  TODO
  Process should be user-owned and deployed by user from their wallet as a first step in using the AF DCA agent app
    -> this prevents dos type attacks that could occur by spam-registrations

  TODO
  Process doesn't reflect history of ownership transfers (not for mvp, in any case)
--]]

local json = require "json"

Owner = Owner or ao.env.Process.Owner

AgentsPerUser = AgentsPerUser or
{}                                  -- map user to his agents - only needed for mvp where the registry is not user-owned but universal
AgentInfo = AgentInfo or {}         -- historical info on one specific agent

Handlers.add(
  "getOwner",
  Handlers.utils.hasMatchingTag("Action", "GetOwner"),
  function(msg)
    Handlers.utils.reply({
      ["Response-For"] = "GetOwner",
      Data = Owner
    })(msg)
  end
)

Handlers.add(
  'registerAgent',
  Handlers.utils.hasMatchingTag('Action', 'RegisterAgent'),
  function(msg)
    -- TODO ownership.onlyOwner(msg) when we're ready to support it on the frontend
    local agent = msg.Tags.Agent
    assert(type(agent) == 'string', 'Agent is required!')
    local sender = msg.From
    AgentsPerUser[sender] = AgentsPerUser[sender] or {}
    table.insert(AgentsPerUser[sender], agent)
    table.insert(AgentInfo, {
      Agent = agent,
      User = sender,
      Timestamp = msg.Timestamp,
      Deposits = {},
      WithdrawalsQuoteToken = {},
      WithdrawalsBaseToken = {},
      DcaBuys = {},
      LiquidationSells = {},
      Retired = false
    })
  end
)

Handlers.add(
  'getLatestAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetLatestAgent'),
  function(msg)
    local sender = msg.From
    local agents = AgentsPerUser[sender] or {}
    local latestAgent = agents[#agents]
    Handlers.utils.reply({
      ["Response-For"] = "GetLatestAgent",
      Data = json.encode(AgentInfo[latestAgent])
    })(msg)
  end
)

-- TRACKING
