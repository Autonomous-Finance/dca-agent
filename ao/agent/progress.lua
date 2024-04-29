local mod = {}

mod.startDepositing = function(msg)
  IsDepositing = true
end

mod.concludeDeposit = function(msg)
  IsDepositing = false
  LastDepositNoticeId = msg.Id
end

mod.concludeWithdraw = function(msg)
  IsWithdrawing = false
  LastWithdrawalNoticeId = msg.Id
end

mod.concludeLiquidation = function(msg)
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
