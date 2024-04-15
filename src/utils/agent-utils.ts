import * as ao from "@permaweb/aoconnect/browser"
import { credSymbol, findCurrencyById } from "./data-utils"

export const CRED_ADDR = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

export const REGISTRY = 'YAt2vbsxMEooMJjWwL6R2OnMGfPib-MnyYL1qExiA2E'

// AGENT INFO AS RETURNED BY AGENT PROCESS
export type AgentStatus = {
  initialized: boolean
  agentName: string
  retired: boolean
  baseToken: string
  quoteToken: string
  swapInAmount: string
  swapIntervalValue: string
  swapIntervalUnit: string
  // timeLeft: number
  // nextBuy: Date
  quoteTokenBalance: string
  baseTokenBalance: string

  // added on Frontend
  statusX?: AgentStatusX
  quoteTokenSymbol?: string
  baseTokenSymbol?: string
}

export const AGENT_STATUS_X_VALUES = ["Active", "Retired", "No Funds"] as const
export type AgentStatusX = typeof AGENT_STATUS_X_VALUES[number]

// AGENT INFO AS RETURNED BY REGISTRY PROCESS
export type RegisteredAgent = {
  // -- tracked in registry
  Owner: string,
  Agent: string,
  AgentName: string,
  SwapIntervalValue: string,
  SwapIntervalUnit: string,
  SwapInAmount: string,
  CreatedAt: number,
  QuoteTokenBalance: string,
  Deposits:  any[],
  TotalDeposited: string,
  WithdrawalsQuoteToken:  any[],
  WithdrawalsBaseToken:  any[],
  DcaBuys:  any[],
  LiquidationSells:  any[],
  Retired:  boolean,
  FromTransfer:  boolean,
  TransferredAt?:  number,
  // -- added on frontend
  statusX?: AgentStatusX, 
  ownedSince?: string, // date string
  provenance?: string // 'Owned' or 'Transferred'
}


export type Receipt<T> = {
  type: "Success" | "Failure"
  result: T
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

export const enhanceRegisteredAgentInfo = (agentInfo: RegisteredAgent) => {
  if (agentInfo.Retired) {
    agentInfo.statusX = 'Retired'
  } else if (Number.parseInt(agentInfo.QuoteTokenBalance) < Number.parseInt(agentInfo.SwapInAmount)) {
    agentInfo.statusX = 'No Funds'
  } else {
    agentInfo.statusX = 'Active'
  }

  agentInfo.ownedSince = (new Date(agentInfo.TransferredAt ?? agentInfo.CreatedAt).toLocaleString())
  agentInfo.provenance = agentInfo.TransferredAt ? 'Transfer' : 'Created'
}

export const enhanceAgentStatus = (agentStatus: AgentStatus) => {
  const hasFunds = Number.parseInt(agentStatus.quoteTokenBalance) >= Number.parseInt(agentStatus.swapInAmount)

  if (agentStatus.retired) {
    agentStatus.statusX = 'Retired'
  } else if (!hasFunds) {
    agentStatus.statusX = 'No Funds'
  } else {
    agentStatus.statusX = 'Active'
  }

  agentStatus.quoteTokenSymbol = credSymbol
  agentStatus.baseTokenSymbol = findCurrencyById(agentStatus.baseToken)
}

export const getOneAgent = async (agentId: string) => {
  try {
    const res = await ao.dryrun({
      process: REGISTRY,
      tags: [
        { name: "Action", value: "GetOneAgent" },
        { name: "Agent", value: agentId },
      ],
    })

    if (res.Error) {
      console.error('Error on dry-run for one agent query', res)
      return {
        type: "Failure",
        result: null
      }
    }

    return {
      type: "Success",
      result: extractResponse(res, 'GetOneAgent')
    }
  } catch (e) {
    console.error('Failed to get agent', e)
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
    } else if (res.Messages.length) {
      const errorMessage = res.Messages.find(
        msg => msg.Tags.some(
          (tag: AoMsgTag) => tag.name === 'Action' && tag.value === 'Transfer-Error')
      );
      if (errorMessage) {
        const errorTag = errorMessage.Tags.find(
          (tag: AoMsgTag) => tag.name === 'Error'
        );
        return {
          type: "Failure",
          result: 'Token Process: ' + errorTag?.value
        }
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

export const withdrawAsset = async (agent: string, amount: string, tokenType: 'quote' | 'base', tokenProcess: string): Promise<Receipt<string>> => {
  try {
    console.log(`Withdrawing ${tokenType} token`);
    const action = tokenType === 'quote' ? "WithdrawQuoteToken" : "WithdrawBaseToken"

    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: action },
        { name: "Quantity", value: amount }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: agent,
    })
    console.log("Result: ", res)
    
    /**
    * We account for possibly failed withdrawals
    *  wrong quantity set by the agent when requesting transfer => 
    *  insufficient balance => 
    *  QuoteToken process will send msg to agent Action = "Transfer-Error" etc.
    */

    if (res.Error) {
      return {
        type: "Failure",
        result: res.Error
      }
    } else if (res.Messages.length) {
      // message from agent to token process
      const transferMessage = res.Messages.find(
        msg => msg.Tags.some(
          (tag: AoMsgTag) => tag.name === 'Action' && tag.value === 'Transfer')
      );
      const transferMsgId = transferMessage?.ID
      const transferResult = await ao.result({
        message: transferMsgId,
        process: tokenProcess,
      })
      console.log("Transfer Result: ", transferResult)

      // messages resulting from the token process handling the transfer message
      if (transferResult.Messages.length) {
        const errorMessage = transferMessage.Messages.find(
          (msg: any) => msg.Tags.some(
            (tag: AoMsgTag) => tag.name === 'Action' && tag.value === 'Transfer-Error')
        );
        if (errorMessage) {
          const errorTag = errorMessage.Tags.find(
            (tag: AoMsgTag) => tag.name === 'Error'
          );
          return {
            type: "Failure",
            result: 'Token Process: ' + errorTag?.value
          }
        }
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

export const withdrawQuote = async (agent: string, amount: string, tokenProcess: string): Promise<Receipt<string>> => {
  return withdrawAsset(agent, amount, 'quote', tokenProcess)
}

export const withdrawBase = async (agent: string, amount: string, tokenProcess: string): Promise<Receipt<string>> => {
  return withdrawAsset(agent, amount, 'base', tokenProcess)
}

export const liquidate = async (agent: string): Promise<Receipt<string>> => {
  console.log('Liquidating agent ', agent)
  return {
    type: "Failure",
    result: "Not implemented"
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
      return {
        type: "Failure",
        result: res.Error
      }
    }
  } catch (e) {
    console.error("Failure!", e)
  }
}

// only for debugging
export const swapDebug = async (agentId: string) => {
  try {
    console.log("Triggering a Swap");
  
    // prepare with a transfer

    const swapMsgId = await ao.message({
      process: agentId,
      tags: [
        { name: "Action", value: "TriggerSwapDebug" },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Triggered Swap: ", swapMsgId)
  
    const swapRes = await ao.result({
      message: swapMsgId,
      process: agentId,
    })
  
    console.log("Swap Trigger result: ", swapRes)

    if (swapRes.Error) {
      throw(swapRes.Error)
    }

    return {
      type: "Success",
      result: swapMsgId
    }

  } catch (e) {
    return {
      type: "Failure",
      result: e
    }
  }
}

