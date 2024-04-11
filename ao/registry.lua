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

Logg = Logg or {}


-- HELPERS
local onlyAgent = function(msg)
  assert(RegisteredAgents[msg.From] ~= nil, "Only a registered agent is allowed")
end


local getAgentAndIndex = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agents = AgentsPerUser[owner] or {}
  for i, agent in ipairs(agents) do
    if agent == agentId then
      return agent, i
    end
  end
end

local getAgentInfoAndIndex = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agentInfos = AgentInfosPerUser[owner] or {}
  for i, agentInfo in ipairs(agentInfos) do
    if agentInfo.Agent == agentId then
      return agentInfo, i
    end
  end
  return nil
end


local changeOwners = function(agentId, newOwner, timestamp)
  local currentOwner = RegisteredAgents[agentId]

  AgentsPerUser[newOwner] = AgentsPerUser[newOwner] or {}
  local _, idxAgent = getAgentAndIndex(agentId)
  table.remove(AgentsPerUser[currentOwner], idxAgent)
  table.insert(AgentsPerUser[newOwner], agentId)

  AgentInfosPerUser[newOwner] = AgentInfosPerUser[newOwner] or {}
  local _, idxAgentInfo = getAgentInfoAndIndex(agentId)
  local info = table.remove(AgentInfosPerUser[currentOwner], idxAgentInfo)
  info["Owner"] = newOwner
  info["FromTransfer"] = true
  info["TransferredAt"] = timestamp
  table.insert(AgentInfosPerUser[newOwner], info)

  RegisteredAgents[agentId] = newOwner
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
    assert(type(msg.Tags.AgentName) == 'string', 'AgentName is required!')
    assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
    assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
    assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')

    local sender = msg.From

    RegisteredAgents[agent] = msg.From
    AgentsPerUser[sender] = AgentsPerUser[sender] or {}
    AgentInfosPerUser[sender] = AgentInfosPerUser[sender] or {}

    table.insert(AgentsPerUser[sender], agent)
    table.insert(AgentInfosPerUser[sender], {
      Owner = sender,
      Agent = agent,
      AgentName = msg.Tags.AgentName,
      SwapInAmount = msg.Tags.SwapInAmount,
      SwapIntervalValue = msg.Tags.SwapIntervalValue,
      SwapIntervalUnit = msg.Tags.SwapIntervalUnit,
      CreatedAt = msg.Timestamp,
      QuoteTokenBalance = "0",
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
  'getOneAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetOneAgent'),
  function(msg)
    local agentId = msg.Tags.Agent
    assert(agentId ~= nil, "Agent is required")
    local owner = RegisteredAgents[agentId]
    assert(owner ~= nil, "No such agent is registered")
    local agentInfo = getAgentInfoAndIndex(agentId)
    assert(agentInfo ~= nil, "Internal: Agent not found")
    Handlers.utils.reply({
      ["Response-For"] = "GetOneAgent",
      Data = json.encode(agentInfo),
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
  'updateQuoteTokenBalance',
  Handlers.utils.hasMatchingTag('Action', 'UpdateQuoteTokenBalance'),
  function(msg)
    onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = getAgentInfoAndIndex(agentId)
    agentInfo.QuoteTokenBalance = msg.Tags.Balance
    Handlers.utils.reply({
      ["Response-For"] = "UpdateQuoteTokenBalance",
      Data = "Success"
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
    local agentInfo = getAgentInfoAndIndex(agentId)
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
    Logg = {}
    Handlers.utils.reply({
      ["Response-For"] = "Wipe",
      Data = "Success"
    })(msg)
  end
)

Handlers.add(
  'retireAgentDebug',
  Handlers.utils.hasMatchingTag('Action', 'RetireAgentDebug'),
  function(msg)
    local agentId = "xqFK4YtdDiJcT8a_pPqWeKhdD7CKGmArIjw7mlW7Ano"
    local agentInfo = getAgentInfoAndIndex(agentId)
    agentInfo.Retired = true
    Handlers.utils.reply({
      ["Response-For"] = "RetireAgentDebug",
      Data = "Success",
    })(msg)
  end
)

Handlers.add(
  'assignOwnerDebug',
  Handlers.utils.hasMatchingTag('Action', 'AssignOwnerDebug'),
  function(msg)
    local agentId = "zSMGBVafyTrNeMVshCo9W0k_JJMEirH7M5kt1atqU_Q"
    local agentInfo = getAgentInfoAndIndex(agentId)
    agentInfo.Owner = "P6i7xXWuZtuKJVJYNwEqduj0s8R_G4wZJ38TB5Knpy4"
    Handlers.utils.reply({
      ["Response-For"] = "AssignOwnerDebug",
      Data = "Success",
    })(msg)
  end
)

Handlers.add(
  'logg',
  Handlers.utils.hasMatchingTag('Action', 'Logg'),
  function(msg)
    Handlers.utils.reply({
      ["Response-For"] = "Logg",
      Data = json.encode(Logg),
    })(msg)
  end
)

Handlers.add(
  'readAllDebug',
  Handlers.utils.hasMatchingTag('Action', 'ReadAllDebug'),
  function(msg)
    Handlers.utils.reply({
      ["Response-For"] = "ReadAllDebug",
      Data = json.encode({
        -- RegisteredAgents,
        -- AgentsPerUser,
        AgentInfosPerUser
      }),
    })(msg)
  end
)


Handlers.add(
  'customDebug',
  Handlers.utils.hasMatchingTag('Action', 'CustomDebug'),
  function(msg)
    Handlers.utils.reply({
      ["Response-For"] = "CustomDebug",
      Data = "Success"
    })(msg)
  end
)
