import * as ao from "@permaweb/aoconnect/browser"
export const AGENT_BACKEND = 'gqCm_H8eYO7ipXd6oVKfyCm46hejmKtMUfOVUGM5yo4'


const {dryrun} = ao.connect({
  CU_URL: "https://cu49.ao-testnet.xyz"
})


// AGENT INFO AS RETURNED BY AGENT PROCESS
export type AgentStatus = {
  initialized: boolean
  agentName: string
  retired: boolean
  paused: boolean
  baseToken: string
  quoteToken: string
  baseTokenTicker: string
  quoteTokenTicker: string
  pool: string
  dex: string
  swapInAmount: string
  swapIntervalValue: string
  swapIntervalUnit: string
  // timeLeft: number
  // nextBuy: Date
  quoteTokenBalance: string
  baseTokenBalance: string
  slippageTolerance: string

  isLiquidating: boolean
  isWithdrawing: boolean
  isDepositing: boolean
  isSwapping: boolean

  lastDepositNoticeId: string
  lastWithdrawalNoticeId: string
  lastLiquidationNoticeId: string
  lastSwapNoticeId: string

  lastWithdrawalError: string
  lastLiquidationError: string
  lastSwapError: string

  // added on Frontend
  statusX?: AgentStatusX
}

export const AGENT_STATUS_X_VALUES = ["Active", "Retired", "No Funds", "Paused"] as const
export type AgentStatusX = typeof AGENT_STATUS_X_VALUES[number]

export type DcaBuy = {
  InputAmount: string, 
  ExpectedOutput: string,
  ActualOutput: string,
  ConfirmedAt: string
}

// AGENT INFO AS RETURNED BY AGENT BACKEND PROCESS
export type RegisteredAgent = {
  // -- tracked in agent backend
  Owner: string,
  Agent: string,
  AgentName: string,
  SwapIntervalValue: string,
  SwapIntervalUnit: string,
  SwapInAmount: string,
  QuoteTokenTicker: string,
  BaseTokenTicker: string,
  CreatedAt: number,
  QuoteTokenBalance: string,
  Deposits:  any[],
  TotalDeposited: string,
  WithdrawalsQuoteToken:  any[],
  WithdrawalsBaseToken:  any[],
  DcaBuys:  DcaBuy[],
  SwapsBack:  any[],
  Retired:  boolean,
  Paused: boolean,
  FromTransfer:  boolean,
  TransferredAt?:  number,
  // -- added on frontend
  statusX?: AgentStatusX, 
  ownedSince?: string, // date string
  provenance?: string, // 'Owned' or 'Transferred'
  averagePrice?: string,
}

export type AgentPerformance = {
  spr: string,
  currentPrice: string,
  currentSwapOutput: string,
  currentSwapBackOutput: string
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
    let respData = respMsg?.Tags.find(
      (tag: AoMsgTag) => tag.name === 'Data'
    )?.value
    if (!respData) {
      respData = respMsg?.Data
    }
    return JSON.parse(respData)
  } else {
    throw('Internal: could not find the data')
  }
}

export const getCurrentSwapOutput = async (pool: string, quoteToken: string, swapInAmount: string) => {
  try {
    const msgId = await ao.message({
      process: pool,
      tags: [
        { name: "Action", value: "Get-Price" },
        { name: "Token", value: quoteToken},
        { name: "Quantity", value: swapInAmount }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })

    const res = await ao.result({
      message: msgId,
      process: pool,
    })

    console.log("Get Current Swap Price Result: ", res)

    if (res.Error) {
      console.error('Error on swap price query', JSON.stringify(res.Error))
    }

    return res.Messages[0].Tags.find((tag: any) => tag.name === 'Price')?.value
  } catch (e) {
    console.error('Failed to get swap price', e)
    return null
  }
}

export const getCurrentSwapBackOutput = async (pool: string, baseToken: string, baseTokenBalance: string) => {
  if (baseTokenBalance == '0') return Promise.resolve('0')
  try {
    const msgId = await ao.message({
      process: pool,
      tags: [
        { name: "Action", value: "Get-Price" },
        { name: "Token", value: baseToken},
        { name: "Quantity", value: baseTokenBalance }
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })

    const res = await ao.result({
      message: msgId,
      process: pool,
    })

    console.log("Get Current Swap Back Price Result: ", res)

    if (res.Error) {
      console.error('Error on swap back price query', JSON.stringify(res.Error))
    }

    return res.Messages[0].Tags.find((tag: any) => tag.name === 'Price')?.value
  } catch (e) {
    console.error('Failed to get swap back price', e)
    return null
  }
}


export const getLatestAgent = async () => {
  try {
    const res = await dryrun({
      process: AGENT_BACKEND,
      tags: [
        { name: "Action", value: "GetLatestAgent" },
        { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
      ],
    })

    if (res.Error) {
      console.error('Error on dry-run for latest agent query', JSON.stringify(res.Error))
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
  } else if (agentInfo.Paused) {
    agentInfo.statusX = 'Paused'
  } else if (Number.parseInt(agentInfo.QuoteTokenBalance) < Number.parseInt(agentInfo.SwapInAmount)) {
    agentInfo.statusX = 'No Funds'
  } else {
    agentInfo.statusX = 'Active'
  }

  agentInfo.ownedSince = (new Date(agentInfo.TransferredAt ?? agentInfo.CreatedAt).toLocaleString())
  agentInfo.provenance = agentInfo.TransferredAt ? 'Transfer' : 'Created by you'

  const totalSpent = agentInfo.DcaBuys.reduce((acc, buy) => acc + Number.parseInt(buy.InputAmount), 0)
  const totalBought = agentInfo.DcaBuys.reduce((acc, buy) => acc + Number.parseInt(buy.ActualOutput), 0)
  if (totalSpent > 0 && totalBought > 0) {
    agentInfo.averagePrice = (totalSpent / totalBought).toFixed(2)
  }
}

export const enhanceAgentStatus = (agentStatus: AgentStatus) => {
  const hasFunds = Number.parseInt(agentStatus.quoteTokenBalance) >= Number.parseInt(agentStatus.swapInAmount)

  if (agentStatus.retired) {
    agentStatus.statusX = 'Retired'
  } else if (agentStatus.paused) {
    agentStatus.statusX = 'Paused'
  } else if (!hasFunds) {
    agentStatus.statusX = 'No Funds'
  } else {
    agentStatus.statusX = 'Active'
  }
}

export const createAgentPerformanceInfo = (
  swapOutputAmount: string, 
  swapBackOutputAmount: string,
  swapInAmount: string,
  averagePrice: string | undefined | null
): AgentPerformance => {
  const price = (Number.parseInt(swapInAmount ?? "0")) / Number.parseInt(swapOutputAmount)
  const spr = averagePrice
    ? price / Number.parseFloat(averagePrice) * 100 
    : null
  return {
    spr: spr?.toFixed(2) ?? "",
    currentPrice: price.toFixed(2),
    currentSwapOutput: swapOutputAmount,
    currentSwapBackOutput: swapBackOutputAmount
  }
}

export const getOneRegisteredAgent = async (agentId: string) => {
  try {
    const res = await dryrun({
      process: AGENT_BACKEND,
      tags: [
        { name: "Action", value: "GetOneAgent" },
        { name: "Agent", value: agentId },
      ],
    })

    if (res.Error) {
      console.error('Error on dry-run for one agent query', JSON.stringify(res.Error))
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
    const res = await dryrun({
      process: AGENT_BACKEND,
      tags: [
        { name: "Action", value: "GetAllAgentsPerUser" },
        { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
      ],
    })
    
    if (res.Error) {
      console.error('Error on dry-run for latest agent query', JSON.stringify(res.Error))
      return {
        type: "Failure",
        result: null
      }
    }

    return {
      type: "Success",
      result: extractResponse(res, 'GetAllAgentsPerUser')
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
    const result = await dryrun({
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

export const depositToAgent = async (agent: string, tokenProcess: string, amount: string): Promise<Receipt<string>> => {
  try {
    console.log("Depositing ", amount);
    
    const prepFlagMsgId = await ao.message({
      process: agent,
      tags: [{ name: "Action", value: "StartDepositing"}],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Prep flag message sent: ", prepFlagMsgId)
    
    const prepRes = await ao.result({
      message: prepFlagMsgId,
      process: agent,
    })

    console.log("Prep Result: ", prepRes)

    if (prepRes.Error) {
      return {
        type: "Failure",
        result: JSON.stringify(prepRes.Error)
      }
    }
    
    const msgId = await ao.message({
      process: tokenProcess,
      tags: [
        { name: "Action", value: "Transfer" },
        { name: "Quantity", value: amount },
        { name: "Recipient", value: agent },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Transfer Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: tokenProcess,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: JSON.stringify(res.Error)
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
        result: JSON.stringify(res.Error)
      }
    } else if (res.Messages.length) {
      // // message from agent to token process
      // const transferMessage = res.Messages.find(
      //   msg => msg.Tags.some(
      //     (tag: AoMsgTag) => tag.name === 'Action' && tag.value === 'Transfer')
      // );
      // const transferMsgId = transferMessage?.ID
      // const transferResult = await ao.result({
      //   message: transferMsgId,
      //   process: tokenProcess,
      // })
      // console.log("Transfer Result: ", transferResult)

      // // messages resulting from the token process handling the transfer message
      // if (transferResult.Messages.length) {
      //   const errorMessage = transferMessage.Messages.find(
      //     (msg: any) => msg.Tags.some(
      //       (tag: AoMsgTag) => tag.name === 'Action' && tag.value === 'Transfer-Error')
      //   );
      //   if (errorMessage) {
      //     const errorTag = errorMessage.Tags.find(
      //       (tag: AoMsgTag) => tag.name === 'Error'
      //     );
      //     return {
      //       type: "Failure",
      //       result: 'Token Process: ' + errorTag?.value
      //     }
      //   }
      // }
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

  try {
    const msgId = await ao.message({
      process: agent,
      tags: [{ name: "Action", value: "Liquidate" }],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Liquidation message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: agent,
    })
  
    console.log("Liquidate Handler Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: JSON.stringify(res.Error)
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
        result: JSON.stringify(res.Error)
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

export const pauseAgent = async (agent: string): Promise<Receipt<string>> => {
  try {
    console.log("Toggling Paused");
  
    const msgId = await ao.message({
      process: agent,
      tags: [
        { name: "Action", value: "PauseToggle" },
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
        result: JSON.stringify(res.Error)
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
        result: JSON.stringify(res.Error)
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
export const wipeBackend = async () => {
  try {
    console.log("!!! Wiping Agent Backend");
  
    const msgId = await ao.message({
      process: AGENT_BACKEND,
      tags: [
        { name: "Action", value: "Wipe" },
      ],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Message sent: ", msgId)
  
    const res = await ao.result({
      message: msgId,
      process: AGENT_BACKEND,
    })
  
    console.log("Result: ", res)

    if (res.Error) {
      return {
        type: "Failure",
        result: JSON.stringify(res.Error)
      }
    }
  } catch (e) {
    console.error("Failure!", e)
  }
}

export const resetProgressFlags = async (agent: string) => {
  try {
    const msgId = await ao.message({
      process: agent,
      tags: [{ name: "Action", value: "ResetProgressFlags" }],
      signer: ao.createDataItemSigner(window.arweaveWallet),
    })
    console.log("Reset Process Flags message sent: ", msgId)
  } catch (e) {
    console.error(e)
    return `Error: ${e}`
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


export const getTotalValue = (quoteTokenBalance: string | null | undefined, swapBackOutput: string | null | undefined) => {
  if (quoteTokenBalance == null || swapBackOutput == null) return null
  const totalValue = Number.parseInt(quoteTokenBalance) + Number.parseInt(swapBackOutput)
  return totalValue.toFixed(2)
}