local json = require "json"

local permissions = require "permissions.permissions"
local lifeCycle = require "agent.life-cycle"
local status = require "agent.status"
local swaps = require "agent.swaps"
local withdrawals = require "agent.withdrawals"
local liquidation = require "agent.liquidation"
local balances = require "agent.balances"
local progress = require "agent.progress"
local ownership = require "agent.ownership"
local patterns = require "utils.patterns"
local response = require "utils.response"

-- set to false in order to disable sending out success confirmation messages
Verbose = Verbose or true

Initialized = Initialized or false
Retired = Retired or false
Paused = Paused or false

AgentName = AgentName or ""
QuoteToken = QuoteToken or ""
BaseToken = BaseToken or ""
QuoteTokenTicker = QuoteTokenTicker or ""
BaseTokenTicker = BaseTokenTicker or ""

Pool = Pool or ""
Dex = Dex or ""

LatestBaseTokenBal = LatestBaseTokenBal or "0"
LatestQuoteTokenBal = LatestQuoteTokenBal or "0"
LiquidationAmountQuote = LiquidationAmountQuote or nil
LiquidationAmountBaseToQuote = LiquidationAmountBaseToQuote or nil

Backend = Backend or 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E' -- hardcoded for mvp, universal for all users

-- flags for helping the frontend properly display the process status
IsSwapping = IsSwapping or false
IsWithdrawing = IsWithdrawing or false
IsDepositing = IsDepositing or false
IsLiquidating = IsLiquidating or false
LastWithdrawalNoticeId = LastWithdrawalNoticeId or nil
LastDepositNoticeId = LastDepositNoticeId or nil
LastLiquidationNoticeId = LastLiquidationNoticeId or nil

-- LIFE CYCLE & CONFIG

Handlers.add(
  "getOwner",
  Handlers.utils.hasMatchingTag("Action", "GetOwner"),
  function(msg)
    response.dataReply("GetOwner", Owner)(msg)
  end
)

Handlers.add(
  "getStatus",
  Handlers.utils.hasMatchingTag("Action", "GetStatus"),
  status.getStatus
)

-- msg to be sent by end user
Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  lifeCycle.initialize
)

-- ! every handler below is gated on Initialized == true
Handlers.add(
  "checkInit",
  function(msg)
    return not Initialized
  end,
  response.errorMessage("error - process is not initialized")
)

-- ! every handler below is gated on Retired == false
Handlers.add(
  "checkRetired",
  function(msg)
    return Retired
  end,
  response.errorMessage("error - process is retired")
)

Handlers.add(
  "pauseToggle",
  Handlers.utils.hasMatchingTag("Action", "PauseToggle"),
  function(msg)
    permissions.onlyOwner(msg)
    lifeCycle.pauseToggle(msg)
  end
)

Handlers.add(
  "retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    permissions.onlyOwner(msg)
    lifeCycle.retire(msg)
  end
)

-- OWNERSHIP

Handlers.add(
  "transferOwnership",
  Handlers.utils.hasMatchingTag("Action", "TransferOwnership"),
  function(msg)
    permissions.onlyOwner(msg)
    ownership.transfer(msg)
  end
)

-- TRACK BALANCES -- ! keep these handlers here at the top of the file (because continue patterns)

Handlers.add(
  "balanceUpdateCreditQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  balances.balanceUpdateCreditQuoteToken
)

Handlers.add(
  "balanceUpdateDebitQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  balances.balanceUpdateDebitQuoteToken
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateQuoteToken",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == QuoteToken
        and m.Target == ao.id
    return isMatch and -1 or 0
  end,
  balances.latestBalanceUpdateQuoteToken
)

Handlers.add(
  "balanceUpdateCreditBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  balances.balanceUpdateCreditBaseToken
)

Handlers.add(
  "balanceUpdateDebitBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  balances.balanceUpdateDebitBaseToken
)

-- response to the balance request
Handlers.add(
  "latestBalanceUpdateBaseToken",
  function(m)
    local isMatch = m.Tags.Balance ~= nil
        and m.From == BaseToken
        and m.Target == ao.id
    return isMatch and -1 or 0
  end,
  balances.latestBalanceUpdateBaseToken
)

-- --------------------------------------

-- PROGRESS FLAGS

Handlers.add(
  "startDepositing",
  Handlers.utils.hasMatchingTag("Action", "StartDepositing"),
  progress.startDepositing
)

Handlers.add(
  "concludeDeposit",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  progress.concludeDeposit
)

Handlers.add(
  "concludeWithdraw",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  progress.concludeWithdraw
)

Handlers.add(
  "concludeLiquidation",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  progress.concludeLiquidation
)

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
Handlers.add(
  'resetProgressFlags',
  Handlers.utils.hasMatchingTag('Action', 'ResetProgressFlags'),
  progress.resetProgressFlags
)

-- --------------------------------------

-- SWAP (DCA)

Handlers.add(
  "triggerSwap",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwap"),
  function(msg)
    if not msg.Cron then return end
    ao.send({ Target = ao.id, Action = "Log-TriggerSwap" })
    swaps.triggerSwap()
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsSwapping
  end,
  swaps.swapExec
)

-- response to successful swap
Handlers.add(
  'orderConfirmation',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  swaps.concludeSwap
)

-- SWAP BACK (in order to LIQUIDATE)

-- response to the price request for SWAP BACK
Handlers.add(
  'swapBackExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsLiquidating
  end,
  liquidation.swapBackExec
)

-- response to successful SWAP BACK
Handlers.add(
  'orderConfirmationSwapBack',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  liquidation.concludeSwapBack
)

-- last step of the liquidation process
Handlers.add(
  "withdrawAfterSwapBack",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  liquidation.concludeLiquidation
)

-- WITHDRAW

Handlers.add(
  "withdrawQuoteToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawQuoteToken"),
  function(msg)
    permissions.onlyOwner(msg)
    withdrawals.withdrawQuoteToken(msg)
  end
)

Handlers.add(
  "withdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    permissions.onlyOwner(msg)
    withdrawals.withdrawBaseToken(msg)
  end
)

-- LIQUIDATION

Handlers.add(
  "liquidate",
  Handlers.utils.hasMatchingTag("Action", "Liquidate"),
  function(msg)
    permissions.onlyOwner(msg)
    liquidation.start(msg)
  end
)

-- MISC CONFIGURATION

Handlers.add(
  "setVerbose",
  Handlers.utils.hasMatchingTag("Action", "SetVerbose"),
  function(msg)
    permissions.onlyOwner(msg)
    Verbose = msg.Tags.Verbose
    response.success("SetVerbose")(msg)
  end
)

-- DEBUG / DEV

Handlers.add(
  "triggerSwapDebug",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwapDebug"),
  function(msg)
    permissions.onlyOwner(msg)
    IsSwapping = true
    swaps.triggerSwap()
  end
)

Handlers.add(
  "getFlags",
  Handlers.utils.hasMatchingTag("Action", "GetFlags"),
  function(msg)
    response.dataReply("GetFlags", json.encode({
      IsSwapping = IsSwapping,
      IsWithdrawing = IsWithdrawing,
      IsDepositing = IsDepositing,
      IsLiquidating = IsLiquidating
    }))(msg)
  end
)
