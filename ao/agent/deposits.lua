local dexi = require "agent.dexi-agent-marketplace"

local mod = {}

mod.isDepositNotice = function(msg)
  return msg.From == QuoteToken
      and msg.Sender ~= Pool -- exlude refunds from pool
      and not IsLiquidating
end

mod.recordDeposit = function(msg)
  if msg.Sender == Pool then return end -- do not register pool refunds as deposits
  ao.send({
    Target = Backend,
    Action = "Deposit",
    Sender = msg.Tags.Sender,
    Quantity = msg.Quantity
  })
  TotalDeposited = tostring(tonumber(TotalDeposited) + tonumber(msg.Quantity))
  dexi.reportOverviewToAgentMarketplace()
end

return mod
