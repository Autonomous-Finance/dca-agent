BaseToken = BaseToken or "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc" -- AO CRED on testnet
-- TargetToken = TargetToken or "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ" -- BARK on testnet
TargetToken = TargetToken or nil

Pool = "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0" -- BARK/aoCRED pool on testnet

SwapInAmount = SwapInAmount or nil
SlippageTolerance = SlippageTolerance or nil -- basis points

LatestPrice = LatestPrice or 0               -- price of TargetToken expressed in BaseToken

local bot = {}

bot.init = function()
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = TargetToken,
    Quantity = SwapInAmount
  })
end

Handlers.add(
  "updatePrice",
  function(msg)
    return "continue"
  end,
  function(msg)
    if msg.From == Pool and msg.Price ~= nil then
      LatestPrice = msg.Price
    end
  end
)

SwapInit = function()
  -- send the transfer
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = SwapInAmount,
    Recipient = Pool
  })
end

SwapExec = function(transferId)
  assert(type(transferId) == 'string', 'transferId is required!')
  -- swap interaction
  ao.message({
    Target = Pool,
    Action = "Swap",
    Transfer = transferId,
    Pool = Pool,
    ["Slippage-Tolerance"] = "100", -- TODO check how pool interprets the value, is it basis points?
    ["Expected-Output"] = CalcExpectedOutput(),
  })
end


CalcExpectedOutput = function()
  -- TODO refine calc
  local amount = tonumber(SwapInAmount)
  local priceAdj = LatestPrice
  local expectedOutput = amount * priceAdj
  return expectedOutput
end


return bot
