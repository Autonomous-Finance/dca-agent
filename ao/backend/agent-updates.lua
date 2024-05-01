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
