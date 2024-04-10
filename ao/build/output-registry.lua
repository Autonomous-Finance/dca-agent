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

  Process is deployed once per dApp and has no access control - any process can be registered as a dca agent,
  but it doesn't impact expected behavior since registration is associated with the sender of a message (spamming won't harm the process)

  TODO
  Process should reflect history of ownership transfers
--]]

local json = require "json"

Owner = Owner or ao.env.Process.Owner

AgentsPerUser = AgentsPerUser or {}         -- map user to his agents (process ids)
AgentInfosPerUser = AgentInfosPerUser or {} -- map user to historical info on his agents (tables)
RegisteredAgents = RegisteredAgents or {}   -- map agent id to current owner (user)

-- HELPERS
local onlyAgent = function(msg)
  assert(RegisteredAgents[msg.From] ~= nil, "Only a registered agent is allowed")
end


local getAgentFromMapping = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agents = AgentsPerUser[owner] or {}
  for i, agent in ipairs(agents) do
    if agent == agentId then
      return i, agent
    end
  end
end

local getAgentInfoFromMapping = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agentInfos = AgentInfosPerUser[owner] or {}
  for i, agentInfo in ipairs(agentInfos) do
    if agentInfo.Agent == agentId then
      return i, agentInfo
    end
  end
  return nil
end


local changeOwners = function(agentId, newOwner, timestamp)
  local currentOwner = RegisteredAgents[agentId]

  RegisteredAgents[agentId] = newOwner

  local idxAgent, _ = getAgentFromMapping(agentId)
  table.remove(AgentsPerUser[currentOwner], idxAgent)
  table.insert(AgentsPerUser[newOwner], agentId)

  local idxAgentInfo, _ = getAgentInfoFromMapping(agentId)
  local info = table.remove(AgentInfosPerUser[currentOwner], idxAgentInfo)
  info["Owner"] = newOwner
  info["FromTransfer"] = true
  info["TransferredAt"] = timestamp
  table.insert(AgentInfosPerUser[newOwner], info)
end

-- REGISTRATION

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

-- msg to be sent by end user
Handlers.add(
  'registerAgent',
  Handlers.utils.hasMatchingTag('Action', 'RegisterAgent'),
  function(msg)
    local agent = msg.Tags.Agent
    assert(type(agent) == 'string', 'Agent is required!')

    local sender = msg.From

    RegisteredAgents[agent] = msg.From
    AgentsPerUser[sender] = AgentsPerUser[sender] or {}
    AgentInfosPerUser[sender] = AgentInfosPerUser[sender] or {}

    table.insert(AgentsPerUser[sender], agent)
    table.insert(AgentInfosPerUser[sender], {
      Agent = agent,
      CreatedAt = msg.Timestamp,
      Deposits = {},
      WithdrawalsQuoteToken = {},
      WithdrawalsBaseToken = {},
      DcaBuys = {},
      LiquidationSells = {},
      Retired = false,
      FromTransfer = false,
      TransferredAt = nil
    })
    Handlers.utils.reply({
      ["Response-For"] = "RegisterAgent",
      Data = "Success"
    })(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'transferAgent',
  Handlers.utils.hasMatchingTag('Action', 'TransferAgent'),
  function(msg)
    onlyAgent(msg)
    local newOwner = msg.Tags.NewOwner
    assert(type(newOwner) == 'string', 'NewOwner is required!')
    local agentId = msg.From
    changeOwners(agentId, newOwner, msg.Timestamp)
  end
)

-- FEATURES

-- msg to be sent by end user
Handlers.add(
  'getAllAgents',
  Handlers.utils.hasMatchingTag('Action', 'GetAllAgents'),
  function(msg)
    local owner = msg.Tags["Owned-By"]
    Handlers.utils.reply({
      ["Response-For"] = "GetAllAgents",
      Data = json.encode(AgentInfosPerUser[owner] or {}),
    })(msg)
  end
)

Handlers.add(
  'getLatestAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetLatestAgent'),
  function(msg)
    local owner = msg.Tags["Owned-By"]
    local agentInfos = AgentInfosPerUser[owner] or {}
    local latestAgentInfo = agentInfos[#agentInfos]

    Handlers.utils.reply({
      ["Response-For"] = "GetLatestAgent",
      Data = json.encode(latestAgentInfo),
    })(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'retireAgent',
  Handlers.utils.hasMatchingTag('Action', 'RetireAgent'),
  function(msg)
    onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = getAgentInfoFromMapping(agentId)
    agentInfo.Retired = true
    Handlers.utils.reply({
      ["Response-For"] = "RetireAgent",
      Data = "Success"
    })(msg)
  end
)

-- DEV / DEBUGGING

Handlers.add(
  'wipe',
  Handlers.utils.hasMatchingTag('Action', 'Wipe'),
  function(msg)
    AgentsPerUser = {}
    AgentInfosPerUser = {}
    RegisteredAgents = {}
    Handlers.utils.reply({
      ["Response-For"] = "Wipe",
      Data = "Success"
    })(msg)
  end
)
