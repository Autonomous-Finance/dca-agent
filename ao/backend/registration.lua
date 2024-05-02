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
  local fields = {
    "AgentName",
    "SwapInAmount",
    "SwapIntervalValue",
    "SwapIntervalUnit",
    "QuoteTokenTicker",
    "BaseTokenTicker"
  }
  for _, field in ipairs(fields) do
    assert(type(msg.Tags[field]) == 'string', field .. ' is required as a string!')
  end

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
