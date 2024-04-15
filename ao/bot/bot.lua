Pool = "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0" -- BARK/aoCRED pool on testnet bark dex

SwapIntervalValue = SwapIntervalValue or nil
SwapIntervalUnit = SwapIntervalUnit or nil
SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil -- basis points


SwapExpectedOutput = SwapExpectedOutput or nil -- used to perform swaps, requested before any particular swap

LatestPrice = LatestPrice or nil               -- price of BaseToken expressed in QuoteToken
-- used by frontend to express simulated swap results

local bot = {}

bot.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = SwapInAmount
  })
end

bot.updatePrice = function(msg)
  if msg.From == Pool and msg.Price ~= nil then
    LatestPrice = msg.Price
  end
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

bot.swapExec = function()
  assert(type(TransferId) == 'string', 'transferId is required!')
  -- swap interaction
  ao.message({
    Target = Pool,
    Action = "Swap",
    Transfer = TransferId,
    Pool = Pool,
    ["Slippage-Tolerance"] = SlippageTolerance or "1",
    ["Expected-Output"] = SwapExpectedOutput,
  })
end


return bot
