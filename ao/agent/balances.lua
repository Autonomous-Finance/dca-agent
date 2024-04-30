local mod = {}


mod.balanceUpdateCreditQuoteToken = function(msg)
  if msg.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
  if msg.Sender == Pool then return end -- do not register pool refunds as deposits
  ao.send({
    Target = Backend,
    Action = "Deposit",
    Sender = msg.Tags.Sender,
    Quantity = msg.Quantity
  })
end

mod.balanceUpdateDebitQuoteToken = function(msg)
  if msg.From ~= QuoteToken then return end
  ao.send({ Target = QuoteToken, Action = "Balance" })
end


mod.latestBalanceUpdateQuoteToken = function(msg)
  LatestQuoteTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateQuoteTokenBalance", Balance = msg.Balance })
end


mod.balanceUpdateCreditBaseToken = function(msg)
  if msg.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end



mod.balanceUpdateDebitBaseToken = function(msg)
  if msg.From ~= BaseToken then return end
  ao.send({ Target = BaseToken, Action = "Balance" })
end


mod.latestBalanceUpdateBaseToken = function(msg)
  LatestBaseTokenBal = msg.Balance
  ao.send({ Target = Backend, Action = "UpdateBaseTokenBalance", Balance = msg.Balance })
end


return mod
