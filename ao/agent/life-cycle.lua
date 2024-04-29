local response = require "utils.response"

local mod = {}

local validateInitData = function(msg)
  assert(type(msg.Tags.BaseToken) == 'string', 'Base Token is required!')
  assert(type(msg.Tags.QuoteToken) == 'string', 'Quote Token is required!')
  assert(type(msg.Tags.BaseTokenTicker) == 'string', 'Base Token Ticker is required!')
  assert(type(msg.Tags.QuoteTokenTicker) == 'string', 'Quote Token Ticker is required!')
  assert(type(msg.Tags.Pool) == 'string', 'Pool is required!')
  assert(type(msg.Tags.Dex) == 'string', 'Dex is required!')
  assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
  assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
  assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')
  assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')
end

mod.initialize = function(msg)
  Owner = msg.Sender
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
  ao.send({ Target = Backend, Action = "RetireAgent" })
  response.success("Retire")(msg)
end

return mod
