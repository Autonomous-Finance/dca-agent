--[[
  This code relates to a process that tracks existing AF DCA agent and their activity
  The purpose of the tracker process is to facilitate queries regarding the current state and history of any AF DCA agent

  Process is deployed once per dApp and has no access control - any process can be registered as a dca agent,
  but it doesn't impact expected behavior since registration is associated with the sender of a message (spamming won't harm this process)

  TODO
  Reflect history of ownership transfers
--]]

local json = require "json"
local response = require "utils.response"
local permissions = require "permissions.permissions"
local helpers = require "backend.helpers"
local registration = require "backend.registration"

-- set to false in order to disable sending out success confirmation messages
Verbose = Verbose or true

AgentsPerUser = AgentsPerUser or {}         -- map user to his agents (process ids)
AgentInfosPerUser = AgentInfosPerUser or {} -- map user to historical info on his agents (tables)
RegisteredAgents = RegisteredAgents or {}   -- map agent id to current owner (user)

-- REGISTRATION

Handlers.add(
  "getOwner",
  Handlers.utils.hasMatchingTag("Action", "GetOwner"),
  function(msg)
    response.dataReply("GetOwner", Owner)(msg)
  end
)

Handlers.add(
  'registerAgent',
  Handlers.utils.hasMatchingTag('Action', 'RegisterAgent'),
  function(msg)
    registration.registerAgent(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'transferAgent',
  Handlers.utils.hasMatchingTag('Action', 'TransferAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    local newOwner = msg.Tags.NewOwner
    assert(type(newOwner) == 'string', 'NewOwner is required!')
    local agentId = msg.From
    helpers.changeOwners(agentId, newOwner, msg.Timestamp)
  end
)

-- FEATURES

-- msg to be sent by end user
Handlers.add(
  'getAllAgentsPerUser',
  Handlers.utils.hasMatchingTag('Action', 'GetAllAgentsPerUser'),
  function(msg)
    local owner = msg.Tags["Owned-By"]
    response.dataReply("GetAllAgentsPerUser", json.encode(AgentInfosPerUser[owner] or {}))(msg)
  end
)

Handlers.add(
  'getAllAgents',
  Handlers.utils.hasMatchingTag('Action', 'GetAllAgents'),
  function(msg)
    response.dataReply("GetAllAgents", json.encode(helpers.getAllAgentsNotRetired()))(msg)
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
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    assert(agentInfo ~= nil, "Internal: Agent not found")
    response.dataReply("GetOneAgent", json.encode(agentInfo))(msg)
  end
)

Handlers.add(
  'getLatestAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetLatestAgent'),
  function(msg)
    local owner = msg.Tags["Owned-By"]
    local agentInfos = AgentInfosPerUser[owner] or {}
    local latestAgentInfo = agentInfos[#agentInfos]
    response.dataReply("GetLatestAgent", json.encode(latestAgentInfo))(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'updateQuoteTokenBalance',
  Handlers.utils.hasMatchingTag('Action', 'UpdateQuoteTokenBalance'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.QuoteTokenBalance = msg.Tags.Balance
    response.success("UpdateQuoteTokenBalance")(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'updateBaseTokenBalance',
  Handlers.utils.hasMatchingTag('Action', 'UpdateBaseTokenBalance'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.BaseTokenBalance = msg.Tags.Balance
    response.success("UpdateBaseTokenBalance")(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'deposited',
  Handlers.utils.hasMatchingTag('Action', 'Deposited'),
  function(msg)
    permissions.onlyAgent(msg)
    assert(type(msg.Tags.Sender) == 'string', 'Sender is required!')
    assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    if agentInfo == nil then
      error("Internal: Agent not found")
    end
    table.insert(agentInfo.Deposits, {
      Sender = msg.Tags.Sender,
      Quantity = msg.Tags.Quantity,
      Timestamp = msg.Timestamp
    })
    agentInfo.TotalDeposited = tostring(tonumber(agentInfo.TotalDeposited) + tonumber(msg.Tags.Quantity))
    response.success("Deposited")(msg)
  end
)

-- message to be sent by agent itself
Handlers.add(
  'swapped',
  Handlers.utils.hasMatchingTag('Action', 'Swapped'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    if agentInfo == nil then
      error("Internal: Agent not found")
    end
    local dcaBuys = agentInfo.DcaBuys
    table.insert(dcaBuys, {
      ConfirmedAt = msg.Tags.ConfirmedAt,
      InputAmount = msg.Tags.InputAmount,
      ExpectedOutput = msg.Tags.ExpectedOutput,
      ActualOutput = msg.Tags.ActualOutput,
    })
    response.success("Swapped")(msg)
  end
)

-- message to be sent by agent itself
Handlers.add(
  'swappedBack',
  Handlers.utils.hasMatchingTag('Action', 'SwappedBack'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    if agentInfo == nil then
      error("Internal: Agent not found")
    end
    local swapsBack = agentInfo.SwapsBack
    table.insert(swapsBack, {
      ConfirmedAt = msg.Tags.ConfirmedAt,
      InputAmount = msg.Tags.InputAmount,
      ExpectedOutput = msg.Tags.ExpectedOutput,
      ActualOutput = msg.Tags.ActualOutput,
    })
    response.success("SwappedBack")(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'pauseToggledAgent',
  Handlers.utils.hasMatchingTag('Action', 'PauseToggleAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.Paused = msg.Tags.Paused == "true"
    response.success("PauseToggleAgent")(msg)
  end
)

-- msg to be sent by agent itself
Handlers.add(
  'retireAgent',
  Handlers.utils.hasMatchingTag('Action', 'RetireAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    local agentId = msg.From
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.Retired = true
    response.success("RetireAgent")(msg)
  end
)

-- MISC CONFIGURATION

Handlers.add(
  "setVerbose",
  Handlers.utils.hasMatchingTag("Action", "SetVerbose"),
  function(msg)
    permissions.onlyOwner(msg)
    Verbose = msg.Tags.Verbose
    response.success("SetVerbose")(msg)
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
    response.success("Wipe")(msg)
  end
)

Handlers.add(
  'retireAgentDebug',
  Handlers.utils.hasMatchingTag('Action', 'RetireAgentDebug'),
  function(msg)
    local agentId = "xqFK4YtdDiJcT8a_pPqWeKhdD7CKGmArIjw7mlW7Ano"
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.Retired = true
    response.success("RetireAgentDebug")(msg)
  end
)

Handlers.add(
  'assignOwnerDebug',
  Handlers.utils.hasMatchingTag('Action', 'AssignOwnerDebug'),
  function(msg)
    local agentId = "zSMGBVafyTrNeMVshCo9W0k_JJMEirH7M5kt1atqU_Q"
    local agentInfo = helpers.getAgentInfoAndIndex(agentId)
    agentInfo.Owner = "P6i7xXWuZtuKJVJYNwEqduj0s8R_G4wZJ38TB5Knpy4"
    response.success("AssignOwnerDebug")(msg)
  end
)
