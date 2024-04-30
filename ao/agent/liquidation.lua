local mod = {}

local json = require "json"

mod.start = function(msg)
  IsLiquidating = true
  ao.send({
    Target = ao.id,
    Data = "Liquidating. Swapping back..." .. json.encode({
      IsSwapping = IsSwapping,
      IsWithdrawing = IsWithdrawing,
      IsDepositing = IsDepositing,
      IsLiquidating = IsLiquidating
    })
  })

  --[[
    we won't rely on latest balances when withdrawing to the owner at the end of the liquidation
    instead we remember quote token balance before the swap back
      => after swap back, we add it to the output quote amount and transfer the whole sum to the owner
    this setup is in order to avoid two separate withdrawals, which would have been the other option
      (one before swap back (HERE), one after the swap back (on quote CREDIT-NOTICE))
  --]]
  LiquidationAmountQuote = LatestQuoteTokenBal
  ao.send({
    Target = Pool,
    Action = "Get-Price",
    Token = BaseToken,
    Quantity = LatestBaseTokenBal
  })
end

mod.swapBackExec = function(msg)
  SwapBackExpectedOutput = msg.Tags.Price
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

mod.concludeSwapBack = function(msg)
  if (msg.Tags["From-Token"] ~= BaseToken) then return end
  ao.send({
    Target = Backend,
    Action = "SwapBack",
    ExpectedOutput = SwapBackExpectedOutput,
    InputAmount = msg.Tags["From-Quantity"],
    ActualOutput = msg.Tags["To-Quantity"],
    ConfirmedAt = tostring(msg.Timestamp)
  })
  SwapBackExpectedOutput = nil
end

mod.concludeLiquidation = function(m)
  if m.From ~= QuoteToken then return end
  if m.Sender ~= Pool then return end
  --[[
    Sender == Pool indicates this credit-notice is from either
      A. a pool payout after swap back (last step of the liquidation process)
      OR
      B. refund after failed dca swap
  --]]
  if LiquidationAmountQuote == nil then
    -- this is B. a refund
    ao.send({ Target = ao.id, Data = "Refund after failed DCA swap : " .. json.encode(m) })
    return
  else
    -- this is A. a payout after swap back
    LiquidationAmountBaseToQuote = m.Tags["Quantity"]

    ao.send({
      Target = QuoteToken,
      Action = "Transfer",
      Quantity = tostring(math.floor(LiquidationAmountQuote + LiquidationAmountBaseToQuote)),
      Recipient = Owner
    })
    LiquidationAmountQuote = nil
    LiquidationAmountBaseToQuote = nil
  end
end

return mod
