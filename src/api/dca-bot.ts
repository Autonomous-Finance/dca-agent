import * as ao from "@permaweb/aoconnect/browser"

import { CRED_ADDR } from "./testnet-cred"

// Send({Target = "6T8XFJnIHp3KqZeR48auLLxcuGRoEL8YQrL84vkepXE", Action = "Tick"})
const ONE = "6T8XFJnIHp3KqZeR48auLLxcuGRoEL8YQrL84vkepXE"

export type Receipt = {
  type: "Success"
  amount: number
}

export async function launch(amount: number): Promise<Receipt> {
  const result = await ao.message({
    process: CRED_ADDR,
    data: "",
    tags: [
      { name: "Action", value: "Transfer" },
      { name: "Recipient", value: ONE },
      { name: "Quantity", value: String(amount) },
    ],
    signer: ao.createDataItemSigner(window.arweaveWallet),
  })
  console.log("📜  launch > result:", result)
  // TODO

  return {
    type: "Success",
    amount,
  }
}

export async function topUp(amount: number): Promise<Receipt> {
  const result = await ao.message({
    process: CRED_ADDR,
    data: "",
    tags: [
      { name: "Action", value: "Transfer" },
      { name: "Recipient", value: ONE },
      { name: "Quantity", value: String(amount) },
    ],
    signer: ao.createDataItemSigner(window.arweaveWallet),
  })
  console.log("📜  topUp > result:", result)
  // TODO

  return {
    type: "Success",
    amount,
  }
}
