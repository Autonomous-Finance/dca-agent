export const credSymbol = "AOCRED-Test" as const

export const truncateId = (text: string) => {
  if (!text || text.length <= 16) return text
  return text.slice(0, 8) + "..." + text.slice(-8)
}

export function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

export function cronDuration(unit: IntervalUnit, value: number ) {

  // account for singular/plural
  const unitAdjusted = value === 1
    ? unit.slice(0, -1)
    : unit
  return `${value}-${unitAdjusted.toLocaleLowerCase()}`
}

export const TYPE_ICON_MAP: Record<string, any> = {
  Process: "/process.svg",
  Message: "/message.svg",
  Module: "/article.svg",
}

export const TYPE_COLOR_MAP: Record<string, string> = {
  Module: "bg-[#B8C3E050]",
  Checkpoint: "bg-[#B8C3E050]",
  Process: "bg-[#B8C3E0]",
  Message: "bg-[#E2F0DC]",
  Owner: "bg-[#FFADAD]",
  Block: "bg-[#FEEEE5]",
  Entity: "bg-[#9EA2AA]",
}

export const TYPE_PATH_MAP: Record<string, string> = {
  Module: "module",
  Checkpoint: "message",
  Process: "entity",
  Message: "message",
  Owner: "entity",
  Block: "block",
  Entity: "entity",
}

export const BASE_CURRENCIES = ["BRKTST", "TRUNK", "0RBT"] as const
export type BaseToken = typeof BASE_CURRENCIES[number]
export const BASE_CURRENCY_PROCESS_MAP: Record<BaseToken, string> = {
  BRKTST: "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ",
  TRUNK: "OT9qTE2467gcozb2g8R6D6N3nQS94ENcaAIJfUzHCww",
  '0RBT': "2bKo3vwB1Mo5TItmxuUQzZ11JgKauU_n2IZO1G13AIk"
}

export const QUOTE_CURRENCIES = [credSymbol, "USDa", "USDT"] as const
export type QuoteToken = typeof QUOTE_CURRENCIES[number]
export const QUOTE_CURRENCY_PROCESS_MAP: Record<QuoteToken, string> = {
  [credSymbol]: "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ",
  USDa: "2bKo3vwB1Mo5TItmxuUQzZ11JgKauU_n2IZO1G13AIk",
  USDT: "OT9qTE2467gcozb2g8R6D6N3nQS94ENcaAIJfUzHCww",
}

export const INTERVAL_UNITS = ["Minutes", "Hours", "Days"] as const
export type IntervalUnit = typeof INTERVAL_UNITS[number]


export const findCurrencyById = (id: string) => {
  return Object.entries(BASE_CURRENCY_PROCESS_MAP).find(([_, value]) => value === id)?.[0]
}

export const LIQUIDITY_POOLS = ["Bark", "Uniswap", "Permaswap"] as const
export type LiquidityPool = typeof LIQUIDITY_POOLS[number]
export const LIQUIDITY_POOL_MAP: Record<LiquidityPool, {pair: string, processId: string}> = {
  Bark: {pair: "BRKTST/aoCRED", processId: "U3Yy3MQ41urYMvSmzHsaA4hJEDuvIm-TgXvSm-wz-X0"},
  Uniswap: {pair: "BRKTST/aoCRED", processId: "igs5_UDB5Aouq-r7ND7dlXLCj9XzTelLsuQ6zidFuas"},
  Permaswap: {pair: "BRKTST/aoCRED", processId: "yhQwCYT3sH7hvU1TSvgfXXE3L13ir0n6zECAa_YPEVU"},
}