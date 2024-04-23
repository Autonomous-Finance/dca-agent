Pool = "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0" -- BARK/aoCRED pool on testnet bark dex

SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil           -- percentage value (22.33 for 22.33%)

SwapExpectedOutput = SwapExpectedOutput or nil         -- used to perform swaps, requested before any particular swap
SwapBackExpectedOutput = SwapBackExpectedOutput or nil -- used to perform swaps, requested before any particular swap

local bot = {}

bot.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

bot.requestSwapOutput = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = QuoteToken,
    Quantity = SwapInAmount
  })
end

bot.swap = function()
  -- prepare swap
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

bot.requestSwapBackOutput = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = LatestBaseTokenBal
  })
end


bot.swapBack = function()
  -- prepare swap back
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = LatestBaseTokenBal,
    Recipient = Pool,
    ["X-Action"] = "Swap",
    ["X-Slippage-Tolerance"] = SlippageTolerance or "1",
    ["X-Expected-Output"] = SwapBackExpectedOutput,
  })
end

return bot
