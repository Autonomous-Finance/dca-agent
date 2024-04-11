import * as ao from "@permaweb/aoconnect/browser"
import { CRED_ADDR } from "./agent-utils"

export async function readCredBalance(userAddr: string) {
  const result = await ao.dryrun({
    process: CRED_ADDR,
    data: "",
    tags: [
      { name: "Action", value: "Balance" },
      { name: "Target", value: userAddr },
    ],
  })

  try {
    const balance = parseFloat(result.Messages[0].Data)
    return balance
  } catch (err) {
    console.error(err)
  }

  return 0
}

export const shortenId = (id: string): string => {
  if (!id || id.length <= 16) return id
  return id.slice(0, 8) + "..." + id.slice(-8)
}