local mod = {}


-- MATCH

mod.isSwapBackPriceResponse = function(msg)
  return msg.From == Pool
      and msg.Tags.Price ~= nil
      and
      IsLiquidating -- would rather use msg.Tags.Token == BaseToken but AMM does not provide it when responding to Get-Price
end

mod.isSwapBackSuccessCreditNotice = function(msg)
  return msg.From == QuoteToken
      and msg.Sender == Pool
      and LiquidationAmountQuote ~= nil
  --[[
        Pool sends us QuoteToken => this credit-notice is from
          A. a pool payout after swap back (within a liquidation)
          OR
          B. refund after failed dca swap

          The presence of LiquidationAmountQuote indicates A.
      --]]
end

mod.isLiquidationDebitNotice = function(msg)
  return msg.From == QuoteToken and msg.Recipient == Owner and IsLiquidating
end

mod.isSwapBackErrorByToken = function(msg)
  return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
      and msg.From == BaseToken
      and IsLiquidating
end

mod.isSwapBackErrorByRefundCreditNotice = function(msg)
  return msg.From == BaseToken
      and msg.Sender == Pool
      and msg.Tags["X-Refunded-Transfer"] ~= nil
end

-- EXECUTE

mod.requestOutput = function(msg)
  ao.send({
    Target = ao.id,
    Data = "Liquidating. Swapping back..."
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

mod.persistSwapBack = function(msg)
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

mod.transferQuoteToOwner = function(msg)
  LiquidationAmountBaseToQuote = msg.Tags["Quantity"]

  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = tostring(math.floor(LiquidationAmountQuote + LiquidationAmountBaseToQuote)),
    Recipient = Owner
  })
end

return mod
