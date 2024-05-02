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
  LatestQuoteTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = msg.Balance })
end

mod.latestBalanceUpdateBaseToken = function(msg)
  LatestBaseTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = msg.Balance })
end

return mod
