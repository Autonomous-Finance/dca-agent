local mod = {}

-- MATCH

mod.isWithdrawError = function(msg)
  return Handlers.utils.hasMatchingTag('Action', 'Transfer-Error')(msg)
      and (msg.From == QuoteToken or msg.From == BaseToken)
      and IsWithdrawing
end

mod.isWithdrawalDebitNotice = function(msg)
  local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
  local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
  return isQuoteWithdrawal or isBaseWithdrawal
end


-- EXECUTE

mod.withdrawQuoteToken = function(msg)
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

mod.withdrawBaseToken = function(msg)
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

return mod
