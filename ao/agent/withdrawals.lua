local mod = {}

mod.withdrawQuoteToken = function(msg)
  IsWithdrawing = true
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

mod.withdrawBaseToken = function(msg)
  IsWithdrawing = true
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

return mod
