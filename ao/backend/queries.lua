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
