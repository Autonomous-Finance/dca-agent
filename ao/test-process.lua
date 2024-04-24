local ownership = require "ownership.ownership"
local bot = require "bot.bot"
local patterns = require "utils.patterns"
local json = require "json"

-- bot deployment triggered by user from browser
--  => browser wallet owner == process owner
Owner = Owner or ao.env.Process.Owner

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
    Handlers.utils.reply({
      ["Response-For"] = "GetOwner",
      Data = Owner
    })(msg)
  end
)

Handlers.add(
  "getStatus",
  Handlers.utils.hasMatchingTag("Action", "GetStatus"),
  function(msg)
    if not Initialized then
      Handlers.utils.reply({
        ["Response-For"] = "GetStatus",
        Data = json.encode({ initialized = false })
      })(msg)
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
      transferId = TransferId,
      transferIdSwapBack = TransferIdSwapBack,
      pool = Pool,
      dex = Dex,
      isDepositing = IsDepositing,
      isWithdrawing = IsWithdrawing,
      isLiquidating = IsLiquidating,
      lastDepositNoticeId = LastDepositNoticeId,
      lastWithdrawalNoticeId = LastWithdrawalNoticeId,
      lastLiquidationNoticeId = LastLiquidationNoticeId
    })
    Handlers.utils.reply({
      ["Response-For"] = "GetStatus",
      Data = config
    })(msg)
  end
)

-- msg to be sent by end user
Handlers.add(
  "initialize",
  Handlers.utils.hasMatchingTag("Action", "Initialize"),
  function(msg)
    Owner = msg.Sender
    assert(not Initialized, 'Process is already initialized')
    Initialized = true
    assert(type(msg.Tags.BaseToken) == 'string', 'Base Token is required!')
    assert(type(msg.Tags.QuoteToken) == 'string', 'Quote Token is required!')
    assert(type(msg.Tags.BaseTokenTicker) == 'string', 'Base Token Ticker is required!')
    assert(type(msg.Tags.QuoteTokenTicker) == 'string', 'Quote Token Ticker is required!')
    assert(type(msg.Tags.Pool) == 'string', 'Pool is required!')
    assert(type(msg.Tags.Dex) == 'string', 'Dex is required!')
    assert(type(msg.Tags.SwapInAmount) == 'string', 'SwapInAmount is required!')
    assert(type(msg.Tags.SwapIntervalValue) == 'string', 'SwapIntervalValue is required!')
    assert(type(msg.Tags.SwapIntervalUnit) == 'string', 'SwapIntervalUnit is required!')
    assert(type(msg.Tags.Slippage) == 'string', 'Slippage is required!')

    AgentName = msg.Tags.AgentName
    BaseToken = msg.Tags.BaseToken
    QuoteToken = msg.Tags.QuoteToken
    BaseTokenTicker = msg.Tags.BaseTokenTicker
    QuoteTokenTicker = msg.Tags.QuoteTokenTicker
    Pool = msg.Tags.Pool
    Dex = msg.Tags.Dex
    SwapInAmount = msg.Tags.SwapInAmount
    SwapIntervalValue = msg.Tags.SwapIntervalValue
    SwapIntervalUnit = msg.Tags.SwapIntervalUnit
    SlippageTolerance = msg.Tags.Slippage

    Handlers.utils.reply({
      ["Response-For"] = "Initialize",
      Data = "Success"
    })(msg)
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
    Handlers.utils.reply({
      ["Response-For"] = "TransferOwnership",
      Data = "Success"
    })(msg)
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
    ao.send({ Target = ao.id, Data = "TICK RECEIVED" })
    -- bot.swapInitByCron()
    ao.send({ Target = ao.id, Action = "TriggerSwapDebug" })
  end
)


-- response to the bot transferring quote token to the pool, in order to prepare the SWAP
Handlers.add(
  "requestSwapOutput",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    -- ensure this was a transfer from the bot to the pool as preliminary to the SWAP
    if m.From ~= QuoteToken then return end
    if m.Recipient ~= Pool then return end

    TransferId = m["Pushed-For"]

    ao.send({
      Target = ao.id,
      Action = "SelfSignalTransferIdSwap",
      Data = "Got TransferId " .. (TransferId or 'nil')
    })

    ao.send({
      Target = Pool,
      Action = "Get-Price",
      Token = QuoteToken,
      Quantity = SwapInAmount
    })
  end
)

-- response to the price request
Handlers.add(
  'swapExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and msg.Tags["Pushed-For"] == TransferId
  end,
  function(msg)
    SwapExpectedOutput = msg.Tags.Price
    ao.send({
      Target = ao.id,
      Action = "SelfSignalSwapExec",
      Data = "Attempt executing swap with expected output " .. SwapExpectedOutput
    })
    bot.swapExec()
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
    TransferId = nil
  end
)

-- SWAP BACK (TO LIQUIDATE)

-- response to the bot transferring quote token to the pool, in order to prepare the SWAP BACK
Handlers.add(
  "requestSwapBackOutput",
  patterns.continue(Handlers.utils.hasMatchingTag("Action", "Debit-Notice")),
  function(m)
    -- ensure this was a transfer from the bot to the pool as preliminary to the SWAP BACK
    if m.From ~= BaseToken then return end
    if m.Recipient ~= Pool then return end

    TransferIdSwapBack = m["Pushed-For"]

    ao.send({
      Target = ao.id,
      Action = "SelfSignalTransferIdSwapBack",
      Data = "Got TransferId for swap back " .. (TransferIdSwapBack or 'nil')
    })

    ao.send({
      Target = Pool,
      Action = "Get-Price",
      Token = BaseToken,
      Quantity = LatestBaseTokenBal
    })
  end
)

-- response to the price request for SWAP BACK
Handlers.add(
  'swapBackExecOnGetPriceResponse',
  function(msg)
    return msg.From == Pool and msg.Tags.Price ~= nil and msg.Tags["Pushed-For"] == TransferIdSwapBack
  end,
  function(msg)
    SwapBackExpectedOutput = msg.Tags.Price
    ao.send({
      Target = ao.id,
      Action = "SelfSignalSwapBackExec",
      Data = "Attempt executing swap back with expected output " .. SwapBackExpectedOutput
    })
    bot.swapBackExec()
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
    TransferIdSwapBack = nil
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
    ownership.onlyOwner(msg)
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
    ownership.onlyOwner(msg)
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
    ownership.onlyOwner(msg)
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
    bot.swapBackInit()
  end
)

-- PAUSE

Handlers.add(
  "pauseToggle",
  Handlers.utils.hasMatchingTag("Action", "PauseToggle"),
  function(msg)
    ownership.onlyOwner(msg)
    Paused = not Paused
    ao.send({ Target = Backend, Action = "PauseToggleAgent", Paused = tostring(Paused) })
    Handlers.utils.reply({
      ["Response-For"] = "PauseToggle",
      Data = "Success"
    })(msg)
  end
)

-- RETIRE

Handlers.add(
  "retire",
  Handlers.utils.hasMatchingTag("Action", "Retire"),
  function(msg)
    ownership.onlyOwner(msg)
    assert(LatestQuoteTokenBal == "0", 'Quote Token balance must be 0 to retire')
    assert(LatestBaseTokenBal == "0", 'Base Token balance must be 0 to retire')
    Retired = true
    ao.send({ Target = Backend, Action = "RetireAgent" })
    Handlers.utils.reply({
      ["Response-For"] = "Retire",
      Data = "Success"
    })(msg)
  end
)

-- DEBUG / DEV

Handlers.add(
  "triggerSwapDebug",
  Handlers.utils.hasMatchingTag("Action", "TriggerSwapDebug"),
  function(msg)
    if msg.From ~= ao.id then
      ownership.onlyOwner(msg)
    end
    ao.send({ Target = ao.id, Data = "SWAP DEBUG from msg: " .. json.encode(msg) })
    bot.swapInit()
  end
)
