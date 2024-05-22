import { dryrunDexiCU } from "./ao-connection"

export type PoolOverviewRaw = {
  token0: string
  transactions: number
  amm_process: string
  token1: string
}

export type PoolOverview = {
  baseToken: string
  transactions: number
  poolId: string
  quoteToken: string
}

const DEXI_MONITOR_CONTRACT = "jao0bfwk99iME8aK_TJLjm8H0bwaHzNuVbKRE1jArRo"


export async function getOverview(): Promise<PoolOverview[]> {
  const result = await dryrunDexiCU({
    process: DEXI_MONITOR_CONTRACT,
    tags: [{ name: "Action", value: "Get-Overview" }],
  })

  if (result.Messages.length === 0) throw new Error("No response from Get-Overview (pools)")
  const { Data: data } = result.Messages[0]

  const raw = JSON.parse(data) as PoolOverviewRaw[]
  console.log("Pool overview:", raw)

  const overviews: PoolOverview[] = raw.map((x: PoolOverviewRaw) => ({
    baseToken: x.token1,
    transactions: x.transactions || 0,
    poolId: x.amm_process,
    quoteToken: x.token0,
  }))

  return overviews.filter((x) => x.baseToken !== "SpzpFLkqPGvr5ZFZPbvyAtizthmrJ13lL4VBQIBL0dg") // afT
}