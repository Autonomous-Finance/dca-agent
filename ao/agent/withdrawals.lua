local mod = {}

mod.withdrawQuoteToken = function(msg)
  IsWithdrawing = true
  LastWithdrawalNoticeId = nil
  LastWithdrawalError = nil
  ao.send({
    Target = QuoteToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

mod.withdrawBaseToken = function(msg)
  IsWithdrawing = true
  LastWithdrawalNoticeId = nil
  LastWithdrawalError = nil
  ao.send({
    Target = BaseToken,
    Action = "Transfer",
    Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
    Recipient = Owner
  })
end

mod.isWithdrawalDebitNotice = function(msg)
  local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
  local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
  return isQuoteWithdrawal or isBaseWithdrawal
end

return mod
