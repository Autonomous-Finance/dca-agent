import * as ao from "@permaweb/aoconnect/browser"

const CRED_ADDR = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

const {dryrun} = ao.connect({
  CU_URL: "https://cu.ao-testnet.xyz"
})


export async function readCredBalance(userAddr: string) {
  const result = await dryrun({
    process: CRED_ADDR,
    data: "",
    tags: [
      { name: "Action", value: "Balance" },
      { name: "Recipient", value: userAddr },
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
  if (!id || id.length <= 8) return id
  return id.slice(0, 4) + "..." + id.slice(-4)
}