import { getOverview, PoolOverview } from "@/utils/pools-utils"
import * as ao from "@permaweb/aoconnect/browser"
import React from "react"

export type Pool = {
  id: string
  name: string
  dex: string // name of the exchange, not yet provided by dexi
  baseToken: string
  quoteToken: string
  baseTokenInfo?: TokenInfo
  quoteTokenInfo?: TokenInfo
}

export type TokenInfo = {
  processId: string
  denomination: number
  ticker: string
  logo: string
  name: string
}

export type Tag = {
  name: string
  value: string
}

export async function getAllPools(): Promise<Pool[]> {
  const poolsOverview: PoolOverview[] = await getOverview()

  const pools: Pool[] = poolsOverview.map((x) => ({
    id: x.poolId,
    name: `monitor-${x.baseToken}/${x.quoteToken}`,
    dex: "DEXI",
    baseToken: x.baseToken,
    quoteToken: x.quoteToken,
  }))

  const poolTokens = Array.from(new Set(pools.map((x) => x.baseToken).concat(pools.map((x) => x.quoteToken))))

  const poolTokenInfoProms: Record<string, Promise<TokenInfo>> = {}
  for (const tokenId of poolTokens) {
    poolTokenInfoProms[tokenId] = getTokenInfo(tokenId)
  }
  const poolTokenInfos = await Promise.all(Object.values(poolTokenInfoProms))
  pools.forEach((pool) => {
    pool.baseTokenInfo = poolTokenInfos.find((x) => x.processId === pool.baseToken)
    pool.quoteTokenInfo = poolTokenInfos.find((x) => x.processId === pool.quoteToken)
  })
  
  return pools
}

export const NATIVE_TOKEN_INFO: TokenInfo = {
  processId: "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc",
  denomination: 3,
  ticker: "AOCRED",
  logo: "eIOOJiqtJucxvB4k8a-sEKcKpKTh9qQgOV3Au7jlGYc",
  name: "AOCRED",
}

const {dryrun} = ao.connect({
  CU_URL: "https://cu.ao-testnet.xyz"
})

export async function getTokenInfo(tokenId: string): Promise<TokenInfo> {
  if (NATIVE_TOKEN_INFO.processId === tokenId) return NATIVE_TOKEN_INFO

  const result = await dryrun({
    process: tokenId,
    data: "",
    tags: [{ name: "Action", value: "Info" }],
  })

  const tags = result.Messages[0].Tags as Tag[]
  const tagMap = tags.reduce(
    (acc, tag) => {
      acc[tag.name] = tag.value
      return acc
    },
    {} as { [key: string]: string },
  )

  const denomination = parseInt(tagMap["Denomination"])

  if (isNaN(denomination)) throw new Error("Denomination is not a number")

  return {
    processId: tokenId,
    denomination,
    ticker: tagMap["Ticker"] === "AO" ? "AOCRED" : tagMap["Ticker"],
    logo: tagMap["Logo"],
    name: tagMap["Name"],
  }
}

export const usePools = () => {
  const [pools, setPools] = React.useState<Pool[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    getAllPools().then((pools) => {
      setPools(pools)
      setLoading(false)
    })
  }, [])

  return {pools, loading}
}