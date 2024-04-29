local mod = {}

mod.isDepositCreditNotice = function(msg)
  return msg.From == QuoteToken
      and not IsLiquidating
end

return mod
