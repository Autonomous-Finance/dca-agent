import * as ao from "@permaweb/aoconnect/browser"
import { arweaveNet } from "@/queries/graphqlClient"
import React from "react"
import { gql } from "urql"

export type Pool = {
  id: string
  name: string
  dex: string // name of the exchange, not yet provided by dexi
  baseToken: string
  quoteToken: string
  tags: Record<string, string>
  created: number
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

const PoolsQuery = gql`
  query {
    transactions(
      tags: [
        { name: "Process-Type", values: ["AMM-Monitor"] }
      ]
      sort: HEIGHT_DESC
      first: 100
    ) {
      edges {
        node {
          id
          block {
            timestamp
            height
          }
          tags {
            name
            value
          }
        }
      }
    }
  }
`

function mapEdgeToPool(edge: any): Pool {
  const node = edge.node
  const tags = node.tags.reduce((acc: Record<string, string>, tag: any) => {
    acc[tag.name] = tag.value
    return acc
  }, {})

  const name = tags["Name"]
  const baseToken = tags["Base-Token"]
  const quoteToken = tags["Quote-Token"]
  const id = tags["Monitor-For"]

  const created = node.block.timestamp * 1000

  return {
    id,
    name,
    dex: 'Bark',
    baseToken,
    quoteToken,
    tags,
    created,
  }
}

export async function getAllPools(): Promise<Pool[]> {
  const result = await arweaveNet.query(PoolsQuery, {}).toPromise()
  const { data, error } = result
  if (error) console.error(error)

  const pools: Pool[] = data.transactions.edges.map(mapEdgeToPool)

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
  // .filter(
  //   (x) =>
  //     x.quoteToken === nativeTokenInfo.processId &&
  //     x.id !== "2bKo3vwB1Mo5TItmxuUQzZ11JgKauU_n2IZO1G13AIk",
  // )
}

export const NATIVE_TOKEN_INFO: TokenInfo = {
  processId: "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc",
  denomination: 3,
  ticker: "AO",
  logo: "eIOOJiqtJucxvB4k8a-sEKcKpKTh9qQgOV3Au7jlGYc",
  name: "AO-CRED",
}

const {dryrun} = ao.connect({
  CU_URL: "https://cu49.ao-testnet.xyz"
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
    ticker: tagMap["Ticker"],
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