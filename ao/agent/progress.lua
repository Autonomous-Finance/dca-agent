local json = require "json"

local mod = {}

-- DEPOSITS

mod.startDepositing = function(msg)
  IsDepositing = true
end

mod.concludeDeposit = function(msg)
  IsDepositing = false
  LastDepositNoticeId = msg.Id
end

-- SWAPS (DCA)

mod.startDCASwap = function(msg)
  IsSwapping = true
  LastSwapNoticeId = nil
  LastSwapError = nil
end

mod.concludeDCASwapOnSuccess = function(msg)
  IsSwapping = false
  LastSwapNoticeId = msg.Id
end

mod.concludeDCASwapOnErrorByToken = function(msg)
  IsSwapping = false
  LastSwapError = msg.Tags.Error
end

mod.concludeDCASwapOnErrorByRefundCreditNotice = function(msg)
  ao.send({ Target = ao.id, Data = "Refund after failed DCA swap : " .. json.encode(msg) })
  IsSwapping = false
  LastSwapError = "Refunded " .. msg.Tags.Quantity .. ' of ' .. QuoteTokenTicker
end

-- WITHDRAWALS

mod.startWithdrawal = function(msg)
  IsWithdrawing = true
  LastWithdrawalNoticeId = nil
  LastWithdrawalError = nil
end

mod.concludeWithdrawalOnSucces = function(msg)
  IsWithdrawing = false
  LastWithdrawalNoticeId = msg.Id
end

mod.concludeWithdrawalOnError = function(msg)
  IsWithdrawing = false
  LastWithdrawalError = msg.Tags.Error
end

-- LIQUIDATION

mod.initLiquidation = function(msg)
  IsLiquidating = true
  LastLiquidationNoticeId = nil
  LastLiquidationError = nil
end

mod.concludeLiquidationOnSuccess = function(msg)
  IsLiquidating = false
  LastLiquidationNoticeId = msg.Id
  LiquidationAmountQuote = nil
  LiquidationAmountBaseToQuote = nil
end

mod.concludeLiquidationOnErrorByToken = function(msg)
  IsLiquidating = false
  LastLiquidationError = msg.Tags.Error
end

mod.concludeLiquidationOnErrorByRefundCreditNotice = function(msg)
  ao.send({ Target = ao.id, Data = "Refund after failed swap back: " .. json.encode(msg) })
  IsLiquidating = false
  LastLiquidationError = "Refunded " .. msg.Tags.Quantity .. ' of ' .. BaseTokenTicker
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
  LastLiquidationError = nil
  LastSwapError = nil
  LastWithdrawalError = nil
end

return mod
