local json = require 'json'
local response = require "utils.response"
local helpers = require "backend.helpers"

local mod = {}

mod.getAgentsPerUser = function(msg)
  local owner = msg.Tags["Owned-By"]
  response.dataReply("GetAllAgentsPerUser", json.encode(AgentInfosPerUser[owner] or {}))(msg)
end

mod.getAllAgents = function(msg)
  response.dataReply("GetAllAgents", json.encode(helpers.getAllAgentsNotRetired()))(msg)
end

mod.getOneAgent = function(msg)
  local agentId = msg.Tags.Agent
  assert(agentId ~= nil, "Agent is required")
  local owner = RegisteredAgents[agentId]
  assert(owner ~= nil, "No such agent is registered")
  local agentInfo = helpers.getAgentInfoAndIndex(agentId)
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
