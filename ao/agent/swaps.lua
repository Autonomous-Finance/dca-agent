SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil           -- percentage value (22.33 for 22.33%)

SwapExpectedOutput = SwapExpectedOutput or nil         -- used to perform swaps, requested before any particular swap
SwapBackExpectedOutput = SwapBackExpectedOutput or nil -- used to perform swaps, requested before any particular swap

local mod = {}

mod.initWithPrice = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

-- MATCH

mod.isSwapPriceResponse = function(msg)
  return msg.From == Pool
      and msg.Tags.Price ~= nil
      and IsSwapping -- would rather use msg.Tags.Token == QuoteToken but AMM does not provide it when responding to Get-Price
end

mod.isDCASwapSuccessCreditNotice = function(msg)
  return msg.From == BaseToken and msg.Sender == Pool
end

mod.isSwapErrorByToken = function(msg)
  return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
      and msg.From == QuoteToken
      and IsSwapping
end

mod.isSwapErrorByRefundCreditNotice = function(msg)
  return msg.From == QuoteToken
      and msg.Sender == Pool
      and msg.Tags["X-Refunded-Transfer"] ~= nil
end

-- EXECUTE

mod.requestOutput = function()
  assert(not Paused, 'Process is paused')
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

mod.persistSwap = function(msg)
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

return mod
