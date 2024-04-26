import { getLatestAgent, RegisteredAgent } from "@/utils/agent-utils";
import React from "react";

const useGetLatestAgent = () => {

  const [agentId, setAgentId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true)

  const getAgent = async () => {
    try {
      const agent = await getLatestAgent()

      if (!agent) return
      const agentId = agent.result?.Agent  
      if (!agentId) {
        console.log('no latest agentProcess found')
        setLoading(false)
        setAgentId(null)
        setDetails(null)
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

// ------------ CHECKS FOR AGENT ------------

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