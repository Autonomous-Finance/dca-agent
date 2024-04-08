import { CRED_ADDR } from "@/api/testnet-cred"
import * as ao from "@permaweb/aoconnect/browser"

export type BotStatus = {
  initialized: true
  targetToken: string
  // type: "Active" | "OutOfFunds" | "Retired"
  // timeLeft: number
  // nextBuy: Date
  baseTokenBalance: string
  targetTokenBalance: string
}
export type BotStatusNonInit = {
  initialized: false
}

export type AoMsgTag = {
  name: string
  value: string
}

export async function readBotStatus(): Promise<BotStatus | BotStatusNonInit | null> {
  const process = window.localStorage.getItem("botProcess");

  if (!process) return null;

  try {
    const result = await ao.dryrun({
      process,
      data: "",
      tags: [{ name: "Action", value: "Status" }],
    })

    if (result.Error) {
      console.log('error on dry-run for status query', result)
      // TODO handle
      return null
    } 

    const respMsg = result.Messages.find(
      msg => msg.Tags.some(
        (tag: AoMsgTag) => tag.name === 'Response-For' && tag.value === 'Status')
    );
    if (respMsg) {
      const respData = respMsg?.Tags.find(
        (tag: AoMsgTag) => tag.name === 'Data'
      )?.value
      return JSON.parse(respData)
    }
  
    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export const depositToBot = async (amount: string) => {
  const bot = window.localStorage.getItem("botProcess");

  if (!bot) return null;

  try {
    console.log("Depositing ", amount);
  
    const msgId = await ao.message({
      process: CRED_ADDR,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Quantity", value: amount },
        { name: "Recipient", value: bot },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: CRED_ADDR,
    })
  
    console.log("Result: ", res)

    return msgId
  } catch (e) {
    console.error(e)
    return null
  }
}

export const withdrawBase = async (amount: string) => {
  const bot = window.localStorage.getItem("botProcess");

  if (!bot) return null;

  try {
    console.log("Withdrawing base token ");
  
    const msgId = await ao.message({
      process: bot,
      tags: [
        { name: "Action", value: "WithdrawBaseToken" },
        { name: "Quantity", value: amount }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: bot,
    })

    // TODO could also wait for credit notice on user, to be absolutely sure
  
    console.log("Result: ", res)

    return msgId
  } catch (e) {
    console.error(e)
    return null
  }
}

export const transferOwnership = async (id: string) => {
  const process = window.localStorage.getItem("botProcess");

  if (!process) return null;

  try {
    console.log("Transferring Ownership to ", id);
  
    const msgId = await ao.message({
      process,
      tags: [{ name: "Action", value: "TransferOwnership" }],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process,
    })
  
    console.log("Result: ", res)

    return msgId;
  } catch (e) {
    console.error(e)
    return null
  }
}