import { getLatestAgentInitilizedBy } from "@/queries/agent.queries"
import * as ao from "@permaweb/aoconnect/browser"

export const CRED_ADDR = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

export const REGISTRY = 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E'

export const credSymbol = "AOCRED-Test"

export type Receipt<T> = {
  type: "Success" | "Failure"
  result: T
}

export type AgentStatus = {
  initialized: boolean
  retired: boolean
  baseToken: string
  quoteToken: string
  // type: "Active" | "OutOfFunds" | "Retired"
  // timeLeft: number
  // nextBuy: Date
  quoteTokenBalance: string
  baseTokenBalance: string
}

export type AoMsgTag = {
  name: string
  value: string
}

type DryRunResult = Awaited<ReturnType<typeof ao.dryrun>>

const extractResponse = (result: DryRunResult, actionName: string) => {
  const respMsg = result.Messages.find(
    msg => msg.Tags.some(
      (tag: AoMsgTag) => tag.name === 'Response-For' && tag.value === actionName)
  );
  if (respMsg) {
    const respData = respMsg?.Tags.find(
      (tag: AoMsgTag) => tag.name === 'Data'
    )?.value
    return JSON.parse(respData)
  } else {
    throw('Internal: could not find the data')
  }
}


export const getLatestAgent = async () => {
  try {
    const res = await ao.dryrun({
      process: REGISTRY,
      tags: [
        { name: "Action", value: "GetLatestAgent" },
        { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
      ],
    })
    if (res.Error) {
      console.error('Error on dry-run for latest agent query', res)
      return {
        type: "Failure",
        result: null
      }
    }

    return {
      type: "Success",
      result: extractResponse(res, 'GetLatestAgent')
    }
  } catch (e) {
    console.error('Failed to get latest agent', e)
    return {
      type: "Failure",
      result: null
    }
  }
}

export const getAllAgents = async () => {
  try {
    const res = await ao.dryrun({
      process: REGISTRY,
      tags: [
        { name: "Action", value: "GetAllAgents" },
        { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
      ],
    })

    if (res.Error) {
      console.error('Error on dry-run for latest agent query', res)
      return {
        type: "Failure",
        result: null
      }
    }

    return {
      type: "Success",
      result: extractResponse(res, 'GetAllAgents')
    }
  } catch (e) {
    console.error('Failed to get all agents', e)
    return {
      type: "Failure",
      result: null
    }
  }
}

export async function readAgentStatus(agent: string): Promise<Receipt<AgentStatus | null>> {
  try {
    const result = await ao.dryrun({
      process: agent,
      data: "",
      tags: [{ name: "Action", value: "GetStatus" }],
    })

    if (result.Error) {
      console.log('error on dry-run for status query', result)
      // TODO handle
      return {
        type: "Failure",
        result: null
      }
    } 

    return {
      type: "Success",
      result: extractResponse(result, 'GetStatus')
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: null
    }
  }
}

export const depositToAgent = async (agent: string, amount: string): Promise<Receipt<string>> => {
  try {
    console.log("Depositing ", amount);
  
    const msgId = await ao.message({
      process: CRED_ADDR,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Quantity", value: amount },
        { name: "Recipient", value: agent },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: CRED_ADDR,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: res.Error
      }
    }

    return {
      type: "Success", 
      result: msgId
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: `Error: ${e}`
    }
  }
}

export const withdrawQuote = async (agent: string, amount: string): Promise<Receipt<string>> => {
  try {
    console.log("Withdrawing quote token ");
  
    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: "WithdrawQuoteToken" },
        { name: "Quantity", value: amount }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: agent,
    })

    // TODO could also wait for credit notice on user, to be absolutely sure
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: res.Error
      }
    }

    return {
      type: "Success", 
      result: msgId
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: `Error: ${e}`
    }
  }
}

export const transferOwnership = async (agent: string, newOwnerId: string): Promise<Receipt<string>> => {
  try {
    console.log("Transferring Ownership to ", newOwnerId);
  
    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: "TransferOwnership" },
        { name: "NewOwner", value: newOwnerId }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: agent,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: res.Error
      }
    }

    return {
      type: "Success", 
      result: msgId
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: `Error: ${e}`
    }
  }
}

export const retireAgent = async (agent: string): Promise<Receipt<string>> => {
  try {
    console.log("Retiring");
  
    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: "Retire" },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: agent,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: res.Error
      }
    }

    return {
      type: "Success", 
      result: msgId
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: `Error: ${e}`
    }
  }
}

// only for debugging
export const wipeRegistry = async () => {
  try {
    console.log("!!! Wiping Registry");
  
    const msgId = await ao.message({
      process: REGISTRY,
      tags: [
        { name: "Action", value: "Wipe" },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: REGISTRY,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      console.error("Failure!")
    }
  } catch (e) {
    console.error("Failure!", e)
  }
}