do
local _ENV = _ENV
package.preload[ "backend.helpers" ] = function( ... ) local arg = _G.arg;
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


mod.getAllAgentsNotRetired = function()
  local allAgents = {}
  for _, agents in pairs(AgentsPerUser) do
    for _, agent in ipairs(agents) do
      if not mod.getAgentInfoAndIndex(agent).Retired then
        table.insert(allAgents, agent)
      end
    end
  end
  return allAgents
end

mod.changeOwners = function(agentId, newOwner, timestamp)
  local currentOwner = RegisteredAgents[agentId]

  AgentsPerUser[newOwner] = AgentsPerUser[newOwner] or {}
  local _, idxAgent = mod.getAgentAndIndex(agentId)
  table.remove(AgentsPerUser[currentOwner], idxAgent)
  table.insert(AgentsPerUser[newOwner], agentId)

  AgentInfosPerUser[newOwner] = AgentInfosPerUser[newOwner] or {}
  local _, idxAgentInfo = mod.getAgentInfoAndIndex(agentId)
  local info = table.remove(AgentInfosPerUser[currentOwner], idxAgentInfo)
  info["Owner"] = newOwner
  info["FromTransfer"] = true
  info["TransferredAt"] = timestamp
  table.insert(AgentInfosPerUser[newOwner], info)

  RegisteredAgents[agentId] = newOwner
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

return mod
end
end

--[[
  This code relates to a process that tracks existing AF DCA agent and their activity
  The purpose of the tracker process is to facilitate queries regarding the current state and history of any AF DCA agent

  Process is deployed once per dApp and has no access control - any process can be registered as a dca agent,
  but it doesn't impact expected behavior since registration is associated with the sender of a message (spamming won't harm this process)

  TODO
  Process should reflect history of ownership transfers
--]]

local json = require "json"
local response = require "utils.response"
local permissions = require "permissions.permissions"
local helpers = require "backend.helpers"

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
  'Deposited',
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
  'pauseToggleAgent',
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
