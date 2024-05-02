local mod = {}

-- MATCH

mod.isBalanceUpdateQuoteToken = function(msg)
  return msg.Tags.Balance ~= nil
      and msg.From == QuoteToken
      and msg.Account == ao.id
end

mod.isBalanceUpdateBaseToken = function(msg)
  return msg.Tags.Balance ~= nil
      and msg.From == BaseToken
      and msg.Account == ao.id
end

-- EXECUTE

mod.balanceUpdateCreditQuoteToken = function(msg)
  ao.send({ Target = QuoteToken, Action = "Balance" })
end

mod.balanceUpdateDebitQuoteToken = function()
  ao.send({ Target = QuoteToken, Action = "Balance" })
end

mod.balanceUpdateCreditBaseToken = function()
  ao.send({ Target = BaseToken, Action = "Balance" })
end

mod.balanceUpdateDebitBaseToken = function()
  ao.send({ Target = BaseToken, Action = "Balance" })
end

mod.latestBalanceUpdateQuoteToken = function(msg)
  -- balance responses may come in any order, so we disregard delayed ones (possibly stale values)
  if (msg.Timestamp > LatestQuoteTokenBalTimestamp) then
    LatestQuoteTokenBal = msg.Balance
    LatestQuoteTokenBalTimestamp = msg.Timestamp
    ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = msg.Balance })
  end
end

mod.latestBalanceUpdateBaseToken = function(msg)
  -- balance responses may come in any order, so we disregard delayed ones (possibly stale values)
  if (msg.Timestamp > LatestBaseTokenBalTimestamp) then
    LatestBaseTokenBal = msg.Balance
    LatestBaseTokenBalTimestamp = msg.Timestamp
    ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = msg.Balance })
  end
end

return mod
