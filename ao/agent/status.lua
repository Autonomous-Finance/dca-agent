local json = require "json"
local response = require "utils.response"

local mod = {}

mod.getStatus = function(msg)
  if not Initialized then
    response.dataReply("GetStatus", json.encode({ initialized = false }))(msg)
    return
  end

  -- is initialized => reply with complete config
  local config = json.encode({
    initialized = true,
    agentName = AgentName,
    retired = Retired,
    paused = Paused,
    baseToken = BaseToken,
    quoteToken = QuoteToken,
    baseTokenTicker = BaseTokenTicker,
    quoteTokenTicker = QuoteTokenTicker,
    swapInAmount = SwapInAmount,
    swapIntervalValue = SwapIntervalValue,
    swapIntervalUnit = SwapIntervalUnit,
    baseTokenBalance = LatestBaseTokenBal,
    quoteTokenBalance = LatestQuoteTokenBal,
    swapExpectedOutput = SwapExpectedOutput,
    swapBackExpectedOutput = SwapBackExpectedOutput,
    slippageTolerance = SlippageTolerance,
    pool = Pool,
    dex = Dex,
    isSwapping = IsSwapping,
    isDepositing = IsDepositing,
    isWithdrawing = IsWithdrawing,
    isLiquidating = IsLiquidating,
    lastDepositNoticeId = LastDepositNoticeId,
    lastWithdrawalNoticeId = LastWithdrawalNoticeId,
    lastLiquidationNoticeId = LastLiquidationNoticeId
  })
  response.dataReply("GetStatus", config)(msg)
end

mod.checkNotBusy = function()
  local flags = json.encode({
    IsSwapping = IsSwapping,
    IsDepositing = IsDepositing,
    IsWithdrawing = IsWithdrawing,
    IsLiquidating = IsLiquidating
  })
  -- LOG
  ao.send({
    Target = ao.id,
    Data = "Checking if busy..." .. flags
  })
  if IsDepositing or IsWithdrawing or IsLiquidating or IsSwapping then
    response.errorMessage(
      "error - process is busy with another action on funds" .. flags
    )()
  end
end

return mod
