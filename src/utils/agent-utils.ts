import { getLatestAgentInitilizedBy } from "@/app/queries/agent.queries"
import * as ao from "@permaweb/aoconnect/browser"

export const CRED_ADDR = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

export const REGISTRY = 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E'

export const credSymbol = "AOCRED-Test"

export type Receipt<T> = {
  type: "Success" | "Failure"
  result: T
}

export type AgentStatus = {
  initialized: true
  retired: boolean
  baseToken: string
  quoteToken: string
  // type: "Active" | "OutOfFunds" | "Retired"
  // timeLeft: number
  // nextBuy: Date
  quoteTokenBalance: string
  baseTokenBalance: string
}
export type AgentStatusNonInit = {
  initialized: false
}

export type AoMsgTag = {
  name: string
  value: string
}


export const getLatestAgent = async () => {
  try {
    const user = await window.arweaveWallet?.getActiveAddress();
    const agent = await getLatestAgentInitilizedBy(user)
    return agent
  } catch (e) {
    console.error('Failed to get latest agent via gql ', e)
  }
}

export async function readAgentStatus(agent: string): Promise<Receipt<AgentStatus | AgentStatusNonInit | null>> {
  if (!agent) return {
    type: "Success",
    result: null
  }

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

    const respMsg = result.Messages.find(
      msg => msg.Tags.some(
        (tag: AoMsgTag) => tag.name === 'Response-For' && tag.value === 'GetStatus')
    );
    if (respMsg) {
      const respData = respMsg?.Tags.find(
        (tag: AoMsgTag) => tag.name === 'Data'
      )?.value
      return {
        type: "Success",
        result: JSON.parse(respData)
      }
    } else {
      throw('Internal: bot status read should have had the data')
    }
  } catch (e) {
    console.error(e)
    return {
      type: "Failure",
      result: null
    }
  }
}

export const depositToAgent = async (amount: string): Promise<Receipt<string>> => {
  const agent = window.localStorage.getItem("agentProcess");

  if (!agent) return {
    type: "Failure",
    result: "Agent not found"
  }

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

export const withdrawQuote = async (amount: string): Promise<Receipt<string>> => {
  const agent = window.localStorage.getItem("agentProcess");

  if (!agent) return {
    type: "Failure",
    result: "Agent not found"
  }

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

export const transferOwnership = async (id: string): Promise<Receipt<string>> => {
  const agent = window.localStorage.getItem("agentProcess");

  if (!agent) return {
    type: "Failure",
    result: "Agent not found"
  }

  try {
    console.log("Transferring Ownership to ", id);
  
    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: "TransferOwnership" },
        { name: "NewOwner", value: id }
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

export const retireAgent = async (): Promise<Receipt<string>> => {
  const agent = window.localStorage.getItem("agentProcess");

  if (!agent) return {
    type: "Failure",
    result: "Agent not found"
  }

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