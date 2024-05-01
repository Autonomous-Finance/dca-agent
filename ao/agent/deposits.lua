local mod = {}

mod.isDepositNotice = function(msg)
  return msg.From == QuoteToken
      and not IsLiquidating
end

return mod
