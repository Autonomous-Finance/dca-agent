local mod = {}


mod.balanceUpdateCreditQuoteToken = function(m)
  ao.send({ Target = QuoteToken, Action = "Balance" })
  if msg.Sender == Pool then return end -- do not register pool refunds as deposits
  ao.send({
    Target = Backend,
    Action = "Deposit",
    Sender = msg.Tags.Sender,
    Quantity = msg.Quantity
  })
end

mod.balanceUpdateDebitQuoteToken = function()
  ao.send({ Target = QuoteToken, Action = "Balance" })
end

mod.latestBalanceUpdateQuoteToken = function(msg)
  LatestQuoteTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = msg.Balance })
end

mod.balanceUpdateCreditBaseToken = function()
  ao.send({ Target = BaseToken, Action = "Balance" })
end

mod.balanceUpdateDebitBaseToken = function()
  ao.send({ Target = BaseToken, Action = "Balance" })
end

mod.latestBalanceUpdateBaseToken = function(msg)
  LatestBaseTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = msg.Balance })
end

mod.isBalanceUpdateQuoteToken = function(m)
  local isMatch = m.Tags.Balance ~= nil
      and m.From == QuoteToken
      and m.Target == ao.id
  return isMatch and -1 or 0
end

mod.isBalanceUpdateBaseToken = function(m)
  local isMatch = m.Tags.Balance ~= nil
      and m.From == BaseToken
      and m.Target == ao.id
  return isMatch and -1 or 0
end

return mod
