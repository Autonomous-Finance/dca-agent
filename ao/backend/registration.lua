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
