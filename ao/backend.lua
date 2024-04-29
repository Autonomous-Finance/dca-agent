--[[
  This code relates to a process that tracks existing AF DCA agent and their activity
  The purpose of the tracker process is to facilitate queries regarding the current state and history of any AF DCA agent

  Process is deployed once per dApp and has no access control - any process can be registered as a dca agent,
  but it doesn't impact expected behavior since registration is associated with the sender of a message (spamming won't harm this process)

  TODO
  Reflect history of ownership transfers
--]]

local response = require "utils.response"
local permissions = require "permissions.permissions"
local queries = require "backend.queries"
local agentUpdates = require "backend.agent-updates"
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
  registration.registerAgent
)

-- QUERIES

Handlers.add(
  'getAllAgentsPerUser',
  Handlers.utils.hasMatchingTag('Action', 'GetAllAgentsPerUser'),
  queries.getAgentsPerUser
)

Handlers.add(
  'getAllAgents',
  Handlers.utils.hasMatchingTag('Action', 'GetAllAgents'),
  queries.getAllAgents
)

Handlers.add(
  'getOneAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetOneAgent'),
  queries.getOneAgent
)

Handlers.add(
  'getLatestAgent',
  Handlers.utils.hasMatchingTag('Action', 'GetLatestAgent'),
  queries.getLatestAgent
)

-- -----------------------------------

-- AGENT UPDATES (sent by agent itself)

Handlers.add(
  'updateQuoteTokenBalance',
  Handlers.utils.hasMatchingTag('Action', 'UpdateQuoteTokenBalance'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.updateQuoteTokenBalance(msg)
  end
)

Handlers.add(
  'updateBaseTokenBalance',
  Handlers.utils.hasMatchingTag('Action', 'UpdateBaseTokenBalance'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.updateBaseTokenBalance(msg)
  end
)

Handlers.add(
  'deposited',
  Handlers.utils.hasMatchingTag('Action', 'Deposit'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.deposited(msg)
  end
)

Handlers.add(
  'swapped',
  Handlers.utils.hasMatchingTag('Action', 'Swap'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.swapped(msg)
  end
)

Handlers.add(
  'swappedBack',
  Handlers.utils.hasMatchingTag('Action', 'SwapBack'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.swappedBack(msg)
  end
)

Handlers.add(
  'pauseToggledAgent',
  Handlers.utils.hasMatchingTag('Action', 'PauseToggleAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.pauseToggledAgent(msg)
  end
)

Handlers.add(
  'transferredAgent',
  Handlers.utils.hasMatchingTag('Action', 'TransferAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.transferredAgent(msg)
  end
)

Handlers.add(
  'retiredAgent',
  Handlers.utils.hasMatchingTag('Action', 'RetireAgent'),
  function(msg)
    permissions.onlyAgent(msg)
    agentUpdates.retiredAgent(msg)
  end
)

-- -----------------------------------

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
