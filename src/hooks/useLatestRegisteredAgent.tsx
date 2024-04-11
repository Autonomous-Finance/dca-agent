import { getLatestAgent } from "@/utils/agent-utils";
import React from "react";


export type RegisteredAgent = {
  // -- tracked in registry
  Owner: string,
  Agent: string,
  CreatedAt: number,
  QuoteTokenBalance: string,
  Deposits:  any[],
  WithdrawalsQuoteToken:  any[],
  WithdrawalsBaseToken:  any[],
  DcaBuys:  any[],
  LiquidationSells:  any[],
  Retired:  boolean,
  FromTransfer:  boolean,
  TransferredAt?:  number,
  // -- added on frontend
  status?: string, // 'Active' | 'Retired' | 'No Funds'
  ownedSince?: string, // date string
  provenance?: string // 'Owned' or 'Transferred'
}

const useGetLatestAgent = () => {

  const [agentId, setAgentId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true)

  const getAgent = async () => {
    try {
      const agent = await getLatestAgent()

      if (!agent) return
      const agentId = agent.result.Agent  
      if (!agentId) {
        console.log('no latest agentProcess found')
        setLoading(false)
        return
      }
      setAgentId(agentId)
      setDetails(agent.result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    getAgent()
  }, []);

 
  const refresh = async () => {
    setLoading(true)
    await getAgent()
  }

  return {loading, agentId, details, refresh}
}

// ------------ CHECKS FOR BOT ------------

const LatestAgentContext = React.createContext<{
  loading: boolean,
  agentId: string | null,
  details: RegisteredAgent | null,
  refresh: () => void
}>({
  loading: true,
  agentId: null,
  details: null,
  refresh: () => {}
})

export const LatestAgentProvider = ({children}: { children: React.ReactNode }) => {
  const agent = useGetLatestAgent()
  return (
    <LatestAgentContext.Provider value={agent}>
      {children}
    </LatestAgentContext.Provider>
  )
}

export const useLatestRegisteredAgent = () => React.useContext(LatestAgentContext)