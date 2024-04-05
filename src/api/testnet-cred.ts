import * as ao from "@permaweb/aoconnect/browser"

export const CRED_ADDR = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

export const credSymbol = "AOCRED-Test"

export async function readBalance(userAddr: string) {
  // const result = await ao.dryrun({
  //   process: CRED_ADDR,
  //   data: "",
  //   tags: [
  //     { name: "Action", value: "Balance" },
  //     { name: "Target", value: userAddr },
  //   ],
  // })

  // try {
  //   const balance = parseFloat(result.Messages[0].Data)
  //   return balance
  // } catch (err) {
  //   console.error(err)
  // }

  return 0
}
