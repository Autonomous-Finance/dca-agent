local permissions = require "permissions.permissions"
local initialization = require "agent.initialization"
local status = require "agent.status"
local swaps = require "agent.swaps"
local patterns = require "utils.patterns"
local response = require "utils.response"
local json = require "json"

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

-- INIT & CONFIG

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
  function(msg)
    status.getStatus(msg)
  end
)

-- msg to be sent by end user
Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    initialization.initialize(msg)
  end
)

-- every handler below is gated on Initialized == true
Handlers.add(
  "checkInit",
  function(msg)
    return not Initialized
  end,
  function(msg)
    error({
      message = "error - process is not initialized"
    })
  end
)

-- every handler below is gated on Retired == false
Handlers.add(
  "checkRetired",
  function(msg)
    return Retired
  end,
  function(msg)
    error({
      message = "error - process is retired"
    })
  end
)

-- OWNERSHIP

Handlers.add(
  "transferOwnership",
  Handlers.utils.hasMatchingTag("Action", "TransferOwnership"),
  function(msg)
    local newOwner = msg.Tags.NewOwner
    assert(newOwner ~= nil and type(newOwner) == 'string', 'NewOwner is required!')
    Owner = newOwner
    ao.send({ Target = Backend, Action = "TransferAgent", NewOwner = newOwner })
    response.success("TransferOwnership")(msg)
  end
)

-- TRACK latest QuoteToken BALANCE -- ! keep these handlers here at the top of the file (continue patterns)

Handlers.add(
  "balanceUpdateCreditQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
    if m.From ~= QuoteToken then return end
    ao.send({ Target = QuoteToken, Action = "Balance" })
    if m.Sender == Pool then return end -- do not register pool refunds as deposits
    ao.send({
      Target = Backend,
      Action = "Deposited",
      Sender = m.Tags.Sender,
      Quantity = m.Quantity
    })
  end
)

Handlers.add(
  "balanceUpdateDebitQuoteToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    if m.From ~= QuoteToken then return end
    ao.send({ Target = QuoteToken, Action = "Balance" })
  end
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
  function(m)
    LatestQuoteTokenBal = m.Balance
    ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = m.Balance })
  end
)

-- TRACK latest BASE TOKEN BALANCE -- ! keep these handlers here at the top of the file (continue patterns)

Handlers.add(
  "balanceUpdateCreditBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
    if m.From ~= BaseToken then return end
    ao.send({ Target = BaseToken, Action = "Balance" })
  end
)

Handlers.add(
  "balanceUpdateDebitBaseToken",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    if m.From ~= BaseToken then return end
    ao.send({ Target = BaseToken, Action = "Balance" })
  end
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
  function(m)
    LatestBaseTokenBal = m.Balance
    ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = m.Balance })
  end
)

-- PROCESS IN PROGRESS FLAGS

Handlers.add(
  "startDepositing",
  Handlers.utils.hasMatchingTag("Action", "StartDepositing"),
  function(msg)
    IsDepositing = true
  end
)

Handlers.add(
  "concludeDeposit",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(msg)
    if msg.From ~= QuoteToken or IsLiquidating then return end
    IsDepositing = false
    LastDepositNoticeId = msg.Id
  end
)

Handlers.add(
  "concludeWithdraw",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(msg)
    local isQuoteWithdrawal = msg.From == QuoteToken and msg.Recipient == Owner and not IsLiquidating
    local isBaseWithdrawal = msg.From == BaseToken and msg.Recipient == Owner
    if not (isQuoteWithdrawal or isBaseWithdrawal) then return end
    IsWithdrawing = false
    LastWithdrawalNoticeId = msg.Id
  end
)

Handlers.add(
  "concludeLiquidation",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(msg)
    local isLiquidation = msg.From == QuoteToken and msg.Recipient == Owner and IsLiquidating
    if not (isLiquidation) then return end
    IsLiquidating = false
    LastLiquidationNoticeId = msg.Id
  end
)

-- Optionally on initial load of the Agent Display, to ensure we don't have residual loading states
-- from unssuccessful processes (e.g. a failed liquidation could still be concluded with withdrawals)
Handlers.add(
  'resetProcessFlags',
  Handlers.utils.hasMatchingTag('Action', 'ResetProcessFlags'),
  function(msg)
    IsWithdrawing = false
    IsDepositing = false
    IsLiquidating = false
    LastDepositNoticeId = nil
    LastWithdrawalNoticeId = nil
    LastLiquidationNoticeId = nil
  end
)

-- SWAP

Handlers.add(
  "triggerSwap",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwap"),
  function(msg)
    if not msg.Cron then return end
    assert(not Paused, 'Process is paused')
    IsSwapping = true
    swaps.requestSwapOutput()
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsSwapping
  end,
  function(msg)
    SwapExpectedOutput = msg.Tags.Price
    swaps.swap()
  end
)

-- response to successful swap
Handlers.add(
  'orderConfirmation',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  function(msg)
    if (msg.Tags["From-Token"] ~= QuoteToken) then return end
    ao.send({
      Target = Backend,
      Action = "Swapped",
      ExpectedOutput = SwapExpectedOutput,
      InputAmount = msg.Tags["From-Quantity"],
      ActualOutput = msg.Tags["To-Quantity"],
      ConfirmedAt = tostring(msg.Timestamp)
    })
    SwapExpectedOutput = nil
    IsSwapping = false
  end
)

-- SWAP BACK (TO LIQUIDATE)

-- response to the price request for SWAP BACK
Handlers.add(
  'swapBackExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and IsLiquidating
  end,
  function(msg)
    SwapBackExpectedOutput = msg.Tags.Price
    swaps.swapBack()
  end
)

-- response to successful SWAP BACK
Handlers.add(
  'orderConfirmationSwapBack',
  patterns.continue(Handlers.utils.hasMatchingTag('Action', 'Order-Confirmation')),
  function(msg)
    if (msg.Tags["From-Token"] ~= BaseToken) then return end
    ao.send({
      Target = Backend,
      Action = "SwappedBack",
      ExpectedOutput = SwapBackExpectedOutput,
      InputAmount = msg.Tags["From-Quantity"],
      ActualOutput = msg.Tags["To-Quantity"],
      ConfirmedAt = tostring(msg.Timestamp)
    })
    SwapBackExpectedOutput = nil
  end
)

-- last step of the liquidation process
Handlers.add(
  "withdrawAfterSwapBack",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Credit-Notice")),
  function(m)
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
)

-- WITHDRAW

Handlers.add(
  "withdrawQuoteToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawQuoteToken"),
  function(msg)
    permissions.onlyOwner(msg)
    IsWithdrawing = true
    ao.send({
      Target = QuoteToken,
      Action = "Transfer",
      Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
      Recipient = Owner
    })
  end
)

Handlers.add(
  "withdrawBaseToken",
  Handlers.utils.hasMatchingTag("Action", "WithdrawBaseToken"),
  function(msg)
    permissions.onlyOwner(msg)
    IsWithdrawing = true
    ao.send({
      Target = BaseToken,
      Action = "Transfer",
      Quantity = msg.Tags.Quantity or LatestQuoteTokenBal,
      Recipient = Owner
    })
  end
)

-- LIQUIDATE

Handlers.add(
  "liquidate",
  Handlers.utils.hasMatchingTag("Action", "Liquidate"),
  function(msg)
    permissions.onlyOwner(msg)
    IsLiquidating = true
    ao.send({ Target = ao.id, Data = "Liquidating. Swapping back..." })
    --[[
      we won't rely on latest balances when withdrawing to the owner at the end of the liquidation
      instead we remember quote token balance before the swap back
        => after swap back, we add it to the output quote amount and transfer the whole sum to the owner
      this setup is in order to avoid two separate withdrawals, which would have been the other option
        (one before swap back (HERE), one after the swap back (on quote CREDIT-NOTICE))
    --]]
    LiquidationAmountQuote = LatestQuoteTokenBal
    swaps.requestSwapBackOutput()
  end
)

-- PAUSE

Handlers.add(
  "pauseToggle",
  Handlers.utils.hasMatchingTag("Action", "PauseToggle"),
  function(msg)
    permissions.onlyOwner(msg)
    Paused = not Paused
    ao.send({ Target = Backend, Action = "PauseToggleAgent", Paused = tostring(Paused) })
    response.success("PauseToggle")(msg)
  end
)

-- RETIRE

Handlers.add(
  "retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    permissions.onlyOwner(msg)
    assert(LatestQuoteTokenBal == "0", 'Quote Token balance must be 0 to retire')
    assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
    Retired = true
    ao.send({ Target = Backend, Action = "RetireAgent" })
    response.success("Retire")(msg)
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
    swaps.requestSwapOutput()
  end
)
