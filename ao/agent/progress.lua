local mod = {}

mod.startDepositing = function(msg)
  IsDepositing = true
end

mod.concludeDeposit = function(msg)
  if msg.From ~= QuoteToken or IsLiquidating then return end
  IsDepositing = false
  LastDepositNoticeId = msg.Id
end

mod.concludeWithdraw = function(msg)
  local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
  local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
  if not (isQuoteWithdrawal or isBaseWithdrawal) then return end
  IsWithdrawing = false
  LastWithdrawalNoticeId = msg.Id
end

mod.concludeLiquidation = function(msg)
  local isLiquidation = msg.From == QuoteToken and msg.Recipient == Owner and IsLiquidating
  if not (isLiquidation) then return end
  IsLiquidating = false
  LastLiquidationNoticeId = msg.Id
end

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
mod.resetProgressFlags = function(msg)
  IsWithdrawing = false
  IsDepositing = false
  IsLiquidating = false
  IsSwapping = false
  LastDepositNoticeId = nil
  LastWithdrawalNoticeId = nil
  LastLiquidationNoticeId = nil
  LastSwapNoticeId = nil
end

return mod
