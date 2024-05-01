local response = require "utils.response"

SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil           -- percentage value (22.33 for 22.33%)

SwapExpectedOutput = SwapExpectedOutput or nil         -- used to perform swaps, requested before any particular swap
SwapBackExpectedOutput = SwapBackExpectedOutput or nil -- used to perform swaps, requested before any particular swap

local mod = {}

mod.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

-- SWAP

mod.triggerSwap = function()
  assert(not Paused, 'Process is paused')
  IsSwapping = true
  LastSwapNoticeId = nil
  LastSwapError = nil
  -- request expected swap output
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = QuoteToken,
    Quantity = SwapInAmount
  })
end

mod.swapExec = function(msg)
  SwapExpectedOutput = msg.Tags.Price
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Recipient = Pool,
    Quantity = SwapInAmount,
    ["X-Action"] = "Swap",
    ["X-Slippage-Tolerance"] = SlippageTolerance or "1",
    ["X-Expected-Output"] = SwapExpectedOutput,
  })
end

mod.concludeSwap = function(msg)
  if (msg.Tags["From-Token"] ~= QuoteToken) then return end
  ao.send({
    Target = Backend,
    Action = "Swap",
    ExpectedOutput = SwapExpectedOutput,
    InputAmount = msg.Tags["From-Quantity"],
    ActualOutput = msg.Tags["To-Quantity"],
    ConfirmedAt = tostring(msg.Timestamp)
  })
  SwapExpectedOutput = nil
end

mod.finalizeDCASwap = function(msg)
  if msg.From ~= BaseToken then return end
  if msg.Sender ~= Pool then return end

  IsSwapping = false
  LastSwapNoticeId = msg.Id
end

return mod
