local mod = {}

mod.computeOverviewState = function()
  return {
    initialized = Initialized,
    initializedAt = InitializedAt,
    name = AgentName,
    retired = Retired,
    retiredAt = RetiredAt,
    holdings = {
      { token = BaseToken,  amount = LatestBaseTokenBal },
      { token = QuoteToken, amount = LatestQuoteTokenBal }
    },
    deposits = {
      { token = QuoteToken, amount = TotalDeposited }
    },
    fees = {
      { token = QuoteToken, amount = Fees }
    }
  }
end

mod.reportOverviewToAgentMarketplace = function()
  if not ao.env.Process.Tags['Agent-Marketplace'] then return end

  local overview = mod.computeOverviewState()
  ao.send({
    Target = ao.env.Process.Tags['Agent-Marketplace'],
    Action = "Update-Agent",
    Data = json.encode(overview)
  })
end

return mod
