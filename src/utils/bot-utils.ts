import * as ao from "@permaweb/aoconnect/browser"
import { CURRENCY_PROCESS_MAP, findCurrencyById as findTokenSymbolById } from "./data-utils"

export type BotStatus = {
  initialized: true
  targetToken: string
  // type: "Active" | "OutOfFunds" | "Retired"
  // timeLeft: number
  // nextBuy: Date
  // baseTokenBalance: number
  // targetTokenBalance: number
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