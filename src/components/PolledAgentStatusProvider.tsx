import { usePolledAgentStatus } from "@/hooks/usePolledAgentStatus"
import { AgentStatus, RegisteredAgent } from "@/utils/agent-utils"
import React from "react"

const PolledAgentStatusContext = React.createContext<{
  loading: boolean,
  agentId: string,
  status: AgentStatus & RegisteredAgent | null
} | null>(null)

export const usePolledAgentStatusContext = () => React.useContext(PolledAgentStatusContext)

export const PolledAgentStatusProvider = ({children, agentId}: { children: React.ReactNode, agentId: string }) => {
  const agent = usePolledAgentStatus({agentId})
  return (
    <PolledAgentStatusContext.Provider value={agent}>
      {children}
    </PolledAgentStatusContext.Provider>
  )
}