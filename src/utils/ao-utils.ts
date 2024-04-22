import * as ao from "@permaweb/aoconnect/browser"
import { CRED_ADDR } from "./agent-utils"

export async function readCredBalance(userAddr: string) {

  // using regular message + result instead of dryrun until dryrun is fixed
  const msgId = await ao.message({
    process: CRED_ADDR,
    data: "",
    tags: [
      { name: "Action", value: "Balance" },
      { name: "Target", value: userAddr },
    ],
    signer: ao.createDataItemSigner(window.arweaveWallet),
  })

  const result = await ao.result({
    message: msgId,
    process: CRED_ADDR,
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
  if (!id || id.length <= 8) return id
  return id.slice(0, 4) + "..." + id.slice(-4)
}