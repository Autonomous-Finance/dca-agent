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
  ao.send({ Target = newOwner, Action = "Ownership-Notice", ["Owned-Process"] = agentId })
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
local assertions = require "utils.assertions"
local Type = require "utils.type"


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
  assertions.Address:assert(agent)
  -- Type:string("is required"):assert(msg.Tags.AgentName)
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
package.preload[ "utils.assertions" ] = function( ... ) local arg = _G.arg;
local Type = require "utils.type"
local bint = require "bint" (512)

local mod = {}

-- Validates if the provided value can be parsed as a Bint
---@param val any Value to validate
---@return boolean
function mod.isBintRaw(val)
  local success, result = pcall(
    function()
      -- check if the value is convertible to a Bint
      if type(val) ~= "number" and type(val) ~= "string" and not bint.isbint(val) then
        return false
      end

      -- check if the val is an integer and not infinity, in case if the type is number
      if type(val) == "number" and (val ~= val or val % 1 ~= 0) then
        return false
      end

      return true
    end
  )

  return success and result
end

-- Verify if the provided value can be converted to a valid token quantity
---@param qty any Raw quantity to verify
---@return boolean
function mod.isTokenQuantity(qty)
  if type(qty) == "nil" then return false end
  if not mod.isBintRaw(qty) then return false end
  if type(qty) == "number" and qty < 0 then return false end
  if type(qty) == "string" and string.sub(qty, 1, 1) == "-" then
    return false
  end

  return true
end

mod.Address = Type
    :string("Invalid type for Arweave address (must be string)")
    :length(43, nil, "Invalid length for Arweave address")
    :match("[A-z0-9_-]+", "Invalid characters in Arweave address")

-- Verify if the provided value is an address
---@param addr any Address to verify
---@return boolean
function mod.isAddress(addr)
  return mod.Address:assert(addr, nil, true)
end

-- Verify if the provided value is a valid percentage for slippages
-- Allowed precision is 2 decimals (min is 0.01)
---@param percentage any Percentage to verify
---@return boolean
function mod.isSlippagePercentage(percentage)
  return type(percentage) == "number" and
      percentage > 0 and
      (percentage * 100) % 1 == 0 and
      percentage < 100
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

do
local _ENV = _ENV
package.preload[ "utils.type" ] = function( ... ) local arg = _G.arg;
---@class Type
local Type = {
  -- custom name for the defined type
  ---@type string|nil
  name = nil,
  -- list of assertions to perform on any given value
  ---@type { message: string, validate: fun(val: any): boolean }[]
  conditions = nil
}

-- Execute an assertion for a given value
---@param val any Value to assert for
---@param message string? Optional message to throw
---@param no_error boolean? Optionally disable error throwing (will return boolean)
function Type:assert(val, message, no_error)
  for _, condition in ipairs(self.conditions) do
    if not condition.validate(val) then
      if no_error then return false end
      self:error(message or condition.message)
    end
  end

  if no_error then return true end
end

-- Add a custom condition/assertion to assert for
---@param message string Error message for the assertion
---@param assertion fun(val: any): boolean Custom assertion function that is asserted with the provided value
function Type:custom(message, assertion)
  -- condition to add
  local condition = {
    message = message,
    validate = assertion
  }

  -- new instance if there are no conditions yet
  if self.conditions == nil then
    local instance = {
      conditions = {}
    }

    table.insert(instance.conditions, condition)
    setmetatable(instance, self)
    self.__index = self

    return instance
  end

  table.insert(self.conditions, condition)
  return self
end

-- Add an assertion for built in types
---@param t "nil"|"number"|"string"|"boolean"|"table"|"function"|"thread"|"userdata" Type to assert for
---@param message string? Optional assertion error message
function Type:type(t, message)
  return self:custom(
    message or ("Not of type (" .. t .. ")"),
    function (val) return type(val) == t end
  )
end

-- Type must be userdata
---@param message string? Optional assertion error message
function Type:userdata(message)
  return self:type("userdata", message)
end

-- Type must be thread
---@param message string? Optional assertion error message
function Type:thread(message)
  return self:type("thread", message)
end

-- Type must be table
---@param message string? Optional assertion error message
function Type:table(message)
  return self:type("table", message)
end

-- Table's keys must be of type t
---@param t Type Type to assert the keys for
---@param message string? Optional assertion error message
function Type:keys(t, message)
  return self:custom(
    message or "Invalid table keys",
    function (val)
      if type(val) ~= "table" then
        return false
      end

      for key, _ in pairs(val) do
        -- check if the assertion throws any errors
        local success = pcall(function () return t:assert(key) end)

        if not success then return false end
      end

      return true
    end
  )
end

-- Type must be array
---@param message string? Optional assertion error message
function Type:array(message)
  return self:table():keys(Type:number(), message)
end

-- Table's values must be of type t
---@param t Type Type to assert the values for
---@param message string? Optional assertion error message
function Type:values(t, message)
  return self:custom(
    message or "Invalid table values",
    function (val)
      if type(val) ~= "table" then return false end

      for _, v in pairs(val) do
        -- check if the assertion throws any errors
        local success = pcall(function () return t:assert(v) end)

        if not success then return false end
      end

      return true
    end
  )
end

-- Type must be boolean
---@param message string? Optional assertion error message
function Type:boolean(message)
  return self:type("boolean", message)
end

-- Type must be function
---@param message string? Optional assertion error message
function Type:_function(message)
  return self:type("function", message)
end

-- Type must be nil
---@param message string? Optional assertion error message
function Type:_nil(message)
  return self:type("nil", message)
end

-- Value must be the same
---@param val any The value the assertion must be made with
---@param message string? Optional assertion error message
function Type:is(val, message)
  return self:custom(
    message or "Value did not match expected value (Type:is(expected))",
    function (v) return v == val end
  )
end

-- Type must be string
---@param message string? Optional assertion error message
function Type:string(message)
  return self:type("string", message)
end

-- String type must match pattern
---@param pattern string Pattern to match
---@param message string? Optional assertion error message
function Type:match(pattern, message)
  return self:custom(
    message or ("String did not match pattern \"" .. pattern .. "\""),
    function (val) return string.match(val, pattern) ~= nil end
  )
end

-- String type must be of defined length
---@param len number Required length
---@param match_type? "less"|"greater" String length should be "less" than or "greater" than the defined length. Leave empty for exact match.
---@param message string? Optional assertion error message
function Type:length(len, match_type, message)
  local match_msgs = {
    less = "String length is not less than " .. len,
    greater = "String length is not greater than " .. len,
    default = "String is not of length " .. len
  }

  return self:custom(
    message or (match_msgs[match_type] or match_msgs.default),
    function (val)
      local strlen = string.len(val)

      -- validate length
      if match_type == "less" then return strlen < len
      elseif match_type == "greater" then return strlen > len end

      return strlen == len
    end
  )
end

-- Type must be a number
---@param message string? Optional assertion error message
function Type:number(message)
  return self:type("number", message)
end

-- Number must be an integer (chain after "number()")
---@param message string? Optional assertion error message
function Type:integer(message)
  return self:custom(
    message or "Number is not an integer",
    function (val) return val % 1 == 0 end
  )
end

-- Number must be even (chain after "number()")
---@param message string? Optional assertion error message
function Type:even(message)
  return self:custom(
    message or "Number is not even",
    function (val) return val % 2 == 0 end
  )
end

-- Number must be odd (chain after "number()")
---@param message string? Optional assertion error message
function Type:odd(message)
  return self:custom(
    message or "Number is not odd",
    function (val) return val % 2 == 1 end
  )
end

-- Number must be less than the number "n" (chain after "number()")
---@param n number Number to compare with
---@param message string? Optional assertion error message
function Type:less_than(n, message)
  return self:custom(
    message or ("Number is not less than " .. n),
    function (val) return val < n end
  )
end

-- Number must be greater than the number "n" (chain after "number()")
---@param n number Number to compare with
---@param message string? Optional assertion error message
function Type:greater_than(n, message)
  return self:custom(
    message or ("Number is not greater than" .. n),
    function (val) return val > n end
  )
end

-- Make a type optional (allow them to be nil apart from the required type)
---@param t Type Type to assert for if the value is not nil
---@param message string? Optional assertion error message
function Type:optional(t, message)
  return self:custom(
    message or "Optional type did not match",
    function (val)
      if val == nil then return true end

      t:assert(val)
      return true
    end
  )
end

-- Table must be of object
---@param obj { [any]: Type }
---@param strict? boolean Only allow the defined keys from the object, throw error on other keys (false by default)
---@param message string? Optional assertion error message
function Type:object(obj, strict, message)
  if type(obj) ~= "table" then
    self:error("Invalid object structure provided for object assertion (has to be a table):\n" .. tostring(obj))
  end

  return self:custom(
    message or ("Not of defined object (" .. tostring(obj) .. ")"),
    function (val)
      if type(val) ~= "table" then return false end

      -- for each value, validate
      for key, assertion in pairs(obj) do
        if val[key] == nil then return false end

        -- check if the assertion throws any errors
        local success = pcall(function () return assertion:assert(val[key]) end)

        if not success then return false end
      end

      -- in strict mode, we do not allow any other keys
      if strict then
        for key, _ in pairs(val) do
          if obj[key] == nil then return false end
        end
      end

      return true
    end
  )
end

-- Type has to be either one of the defined assertions
---@param ... Type Type(s) to assert for
function Type:either(...)
  ---@type Type[]
  local assertions = {...}

  return self:custom(
    "Neither types matched defined in (Type:either(...))",
    function (val)
      for _, assertion in ipairs(assertions) do
        if pcall(function () return assertion:assert(val) end) then
          return true
        end
      end

      return false
    end
  )
end

-- Type cannot be the defined assertion (tip: for multiple negated assertions, use Type:either(...))
---@param t Type Type to NOT assert for
---@param message string? Optional assertion error message
function Type:is_not(t, message)
  return self:custom(
    message or "Value incorrectly matched with the assertion provided (Type:is_not())",
    function (val)
      local success = pcall(function () return t:assert(val) end)

      return not success
    end
  )
end

-- Set the name of the custom type
-- This will be used with error logs
---@param name string Name of the type definition
function Type:set_name(name)
  self.name = name
  return self
end

-- Throw an error
---@param message any Message to log
---@private
function Type:error(message)
  error("[Type " .. (self.name or tostring(self.__index)) .. "] " .. tostring(message))
end

return Type
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
