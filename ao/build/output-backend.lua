do
local _ENV = _ENV
package.preload[ "backend.agent-updates" ] = function( ... ) local arg = _G.arg;
local queries = require "backend.queries"
local response = require "utils.response"

local mod = {}

mod.updateQuoteTokenBalance = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
  agentInfo.QuoteTokenBalance = msg.Tags.Balance
  response.success("UpdateQuoteTokenBalance")(msg)
end

mod.updateBaseTokenBalance = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
  agentInfo.BaseTokenBalance = msg.Tags.Balance
  response.success("UpdateBaseTokenBalance")(msg)
end

mod.deposited = function(msg)
  assert(type(msg.Tags.Sender) == 'string', 'Sender is required!')
  assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
  if agentInfo == nil then
    error("Internal: Agent not found")
  end
  table.insert(agentInfo.Deposits, {
    Sender = msg.Tags.Sender,
    Quantity = msg.Tags.Quantity,
    Timestamp = msg.Timestamp
  })
  agentInfo.TotalDeposited = tostring(tonumber(agentInfo.TotalDeposited) + tonumber(msg.Tags.Quantity))
  response.success("Deposit")(msg)
end

mod.swapped = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
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
  response.success("Swap")(msg)
end

mod.swappedBack = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
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
  response.success("SwapBack")(msg)
end

mod.pauseToggledAgent = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
  agentInfo.Paused = msg.Tags.Paused == "true"
  response.success("PauseToggleAgent")(msg)
end

mod.retiredAgent = function(msg)
  local agentId = msg.From
  local agentInfo = queries.getAgentInfoAndIndex(agentId)
  agentInfo.Retired = true
  response.success("RetireAgent")(msg)
end

-- ownership transfer

local changeOwners = function(agentId, newOwner, timestamp)
  local currentOwner = RegisteredAgents[agentId]

  AgentsPerUser[newOwner] = AgentsPerUser[newOwner] or {}
  local _, idxAgent = queries.getAgentAndIndex(agentId)
  table.remove(AgentsPerUser[currentOwner], idxAgent)
  table.insert(AgentsPerUser[newOwner], agentId)

  AgentInfosPerUser[newOwner] = AgentInfosPerUser[newOwner] or {}
  local _, idxAgentInfo = queries.getAgentInfoAndIndex(agentId)
  local info = table.remove(AgentInfosPerUser[currentOwner], idxAgentInfo)
  info["Owner"] = newOwner
  info["FromTransfer"] = true
  info["TransferredAt"] = timestamp
  table.insert(AgentInfosPerUser[newOwner], info)

  RegisteredAgents[agentId] = newOwner
end
mod.transferredAgent = function(msg)
  local newOwner = msg.Tags.NewOwner
  assert(type(newOwner) == 'string', 'NewOwner is required!')
  local agentId = msg.From
  changeOwners(agentId, newOwner, msg.Timestamp)
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "backend.queries" ] = function( ... ) local arg = _G.arg;
local json = require 'json'
local response = require "utils.response"

local mod = {}


mod.getAgentAndIndex = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agents = AgentsPerUser[owner] or {}
  for i, agent in ipairs(agents) do
    if agent == agentId then
      return agent, i
    end
  end
end

mod.getAgentInfoAndIndex = function(agentId)
  local owner = RegisteredAgents[agentId]
  local agentInfos = AgentInfosPerUser[owner] or {}
  for i, agentInfo in ipairs(agentInfos) do
    if agentInfo.Agent == agentId then
      return agentInfo, i
    end
  end
  return nil
end


mod.getAgentsPerUser = function(msg)
  local owner = msg.Tags["Owned-By"]
  response.dataReply("GetAllAgentsPerUser", json.encode(AgentInfosPerUser[owner] or {}))(msg)
end

--[[
  Returns all agents that are not retired (DEXI integration)
]]
mod.getAllAgents = function(msg)
  local allAgentsNotRetired = {}
  for _, agents in pairs(AgentsPerUser) do
    for _, agent in ipairs(agents) do
      if not mod.getAgentInfoAndIndex(agent).Retired then
        table.insert(allAgentsNotRetired, agent)
      end
    end
  end
  response.dataReply("GetAllAgents", json.encode(allAgentsNotRetired))(msg)
end

mod.getOneAgent = function(msg)
  local agentId = msg.Tags.Agent
  assert(agentId ~= nil, "Agent is required")
  local owner = RegisteredAgents[agentId]
  assert(owner ~= nil, "No such agent is registered")
  local agentInfo = mod.getAgentInfoAndIndex(agentId)
  assert(agentInfo ~= nil, "Internal: Agent not found")
  response.dataReply("GetOneAgent", json.encode(agentInfo))(msg)
end

mod.getLatestAgent = function(msg)
  local owner = msg.Tags["Owned-By"]
  local agentInfos = AgentInfosPerUser[owner] or {}
  local latestAgentInfo = agentInfos[#agentInfos]
  response.dataReply("GetLatestAgent", json.encode(latestAgentInfo))(msg)
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "backend.registration" ] = function( ... ) local arg = _G.arg;
local response = require "utils.response"

local mod = {}

--[[
  Registers an agent with the system
  The message sender is tracked as the owner of the agent
  ]]
---@dev An alternative design would be to have agents register themselves, passing in their respective owner.
---     But since registration is not gated, we can't be sure that processes that register are indeed our agents.
---     A bogus agent could register to be associated with another existing owner, thus polluting that owner's data.

---@param msg Message
mod.registerAgent = function(msg)
  local agent = msg.Tags.Agent
  assert(type(agent) == 'string', 'Agent is required!')
  assert(type(msg.Tags.AgentName) == 'string', 'AgentName is required!')
  assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
  assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
  assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')
  assert(type(msg.Tags.QuoteTokenTicker) == 'string', 'QuoteTokenTicker is required!')
  assert(type(msg.Tags.BaseTokenTicker) == 'string', 'BaseTokenTicker is required!')

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
    QuoteTokenTicker = msg.Tags.QuoteTokenTicker,
    BaseTokenTicker = msg.Tags.BaseTokenTicker,
    CreatedAt = msg.Timestamp,
    QuoteTokenBalance = "0",
    Deposits = {},
    TotalDeposited = "0",
    WithdrawalsQuoteToken = {},
    WithdrawalsBaseToken = {},
    DcaBuys = {},
    SwapsBack = {},
    Retired = false,
    Paused = false,
    FromTransfer = false,
    TransferredAt = nil
  })
  response.success("RegisterAgent")(msg)
end

return mod
end
end

do
local _ENV = _ENV
package.preload[ "permissions.permissions" ] = function( ... ) local arg = _G.arg;
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
return mod
end
end

do
local _ENV = _ENV
package.preload[ "utils.response" ] = function( ... ) local arg = _G.arg;
local mod = {}

--[[
  Using this rather than Handlers.utils.reply() in order to have
  the root-level "Data" set to the provided data (as opposed to a "Data" tag)
]]
---@param tag string Tag name
---@param data any Data to be sent back
function mod.dataReply(tag, data)
  return function(msg)
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = data
    })
  end
end

--[[
  Variant of dataReply that is only sent out for trivial confirmations
  after updates etc.
  Only sends out if global Verbose is set to true.
]]
---@param tag string Tag name
function mod.success(tag)
  return function(msg)
    if not Verbose then return end
    ao.send({
      Target = msg.From,
      ["Response-For"] = tag,
      Data = "Success"
    })
  end
end

function mod.errorMessage(text)
  return function()
    error({
      message = text
    })
  end
end

return mod
end
end

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
