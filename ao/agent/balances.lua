local mod = {}


mod.balanceUpdateCreditQuoteToken = function(m)
  if m.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
  if m.Sender == Pool then return end -- do not register pool refunds as deposits
  ao.send({
    Target = Backend,
    Action = "Deposit",
    Sender = m.Tags.Sender,
    Quantity = m.Quantity
  })
end

mod.balanceUpdateDebitQuoteToken = function(m)
  if m.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
end


mod.latestBalanceUpdateQuoteToken = function(m)
  LatestQuoteTokenBal = m.Balance
  ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = m.Balance })
end


mod.balanceUpdateCreditBaseToken = function(m)
  if m.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end



mod.balanceUpdateDebitBaseToken = function(m)
  if m.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end


mod.latestBalanceUpdateBaseToken = function(m)
  LatestBaseTokenBal = m.Balance
  ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = m.Balance })
end


return mod
