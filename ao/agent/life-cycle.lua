local response = require "utils.response"

local mod = {}

local validateInitData = function(msg)
  local fields = {
    'BaseToken',
    'QuoteToken',
    'BaseTokenTicker',
    'QuoteTokenTicker',
    'Pool',
    'Dex',
    'SwapInAmount',
    'SwapIntervalValue',
    'SwapIntervalUnit',
    'Cron-Interval',
    'Slippage'
  }
  for _, field in ipairs(fields) do
    assert(type(msg.Tags[field]) == 'string', field .. ' is required as a string!')
  end
end

mod.initialize = function(msg)
  assert(not Initialized, 'Process is already initialized')
  Initialized = true

  validateInitData(msg)

  AgentName = msg.Tags.AgentName
  BaseToken = msg.Tags.BaseToken
  QuoteToken = msg.Tags.QuoteToken
  BaseTokenTicker = msg.Tags.BaseTokenTicker
  QuoteTokenTicker = msg.Tags.QuoteTokenTicker
  Pool = msg.Tags.Pool
  Dex = msg.Tags.Dex
  SwapInAmount = msg.Tags.SwapInAmount
  SwapIntervalValue = msg.Tags.SwapIntervalValue
  SwapIntervalUnit = msg.Tags.SwapIntervalUnit
  SlippageTolerance = msg.Tags.Slippage
  InitializedAt = msg.Timestamp

  ao.spawn('SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk', {
    ["Cron-Interval"] = msg.Tags["Cron-Interval"],
    ["Cron-Tag-Action"] = "TriggerSwap",
    ['Owner'] = ao.id
  })

  response.success("Initialize")(msg)
end

mod.pauseToggle = function(msg)
  Paused = not Paused
  ao.send({ Target = Backend, Action = "PauseToggleAgent", Paused = tostring(Paused) })
  response.success("PauseToggle")(msg)
end

mod.retire = function(msg)
  assert(LatestQuoteTokenBal == "0", 'Quote Token balance must be 0 to retire')
  assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
  Retired = true
  RetiredAt = msg.Timestamp
  ao.send({ Target = Backend, Action = "RetireAgent" })
  response.success("Retire")(msg)
end

return mod
