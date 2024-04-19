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

bot.swapInit = function()
  -- prepare swap
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = SwapInAmount,
    Recipient = Pool
  })
end

bot.swapInitByCron = function()
  -- prepare swap
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = SwapInAmount,
    Recipient = Pool,
    ["Pushed-For"] = ao.id
  })
end

bot.swapExec = function()
  assert(type(TransferId) == 'string', 'TransferId is missing!')
  -- swap interaction
  ao.send({
    Target = Pool,
    Action = "Swap",
    Transfer = TransferId,
    Pool = Pool,
    ["Slippage-Tolerance"] = SlippageTolerance or "1",
    ["Expected-Output"] = SwapExpectedOutput,
  })
end

bot.swapBackInit = function()
  -- prepare swap back
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = LatestBaseTokenBal,
    Recipient = Pool
  })
end

bot.swapBackExec = function()
  -- assert(type(TransferIdSwapBack) == 'string', 'TransferIdSwapBack is missing!')
  -- swap interaction
  ao.send({
    Target = Pool,
    Action = "Swap",
    Transfer = TransferIdSwapBack or 'nil',
    Pool = Pool,
    ["Slippage-Tolerance"] = SlippageTolerance or "1",
    ["Expected-Output"] = SwapBackExpectedOutput,
  })
end


return bot
