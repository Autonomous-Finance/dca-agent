import { AgentStatus, AgentStatusNonInit, readAgentStatus } from "@/utils/agent-utils";
import React from "react";

const useAgent = () => {

  const [status, setStatus] = React.useState<AgentStatus | AgentStatusNonInit | null>(null);
  const [polling, setPolling] = React.useState(false);
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    readAgentStatus().then((resp) => {
      if (resp.type === "Success") {
        setStatus(resp.result)
        setLoading(false)
        setPolling(!!resp.result && resp.result.initialized)
      }
      // TODO handle failure?
    })
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const update = async () => {
        if (!polling) return // if no active bot exists, no polling should occur
        const statusRes = await readAgentStatus()
        const status = statusRes.type === "Success" ? statusRes.result : null
        setLoading(false)
        if (status?.initialized) {
          setStatus(status)
        }
        // TODO handle failure?
      }
      update();
    }, 3000)

    return () => clearInterval(interval)
  }, [polling])

  const updateStatus = async () => {
    setLoading(true)
    setPolling(true)
  }

  if (loading || (status && !status?.initialized) || !status) {
    // still loading or no bot found or agent not initialized (can discard case for mvp)
    return {loading, status: null, updateStatus}
  }

  return {loading, status};
}

// ------------ CHECKS FOR BOT ------------

const CheckAgentContext = React.createContext<{
  loading: boolean,
  status: null,
  updateStatus: () => void
} | {
  loading: false,
  status: AgentStatus,
} | null>(null)

export const CheckAgentProvider = ({children}: { children: React.ReactNode }) => {
  const agent = useAgent()
  return (
    <CheckAgentContext.Provider value={agent}>
      {children}
    </CheckAgentContext.Provider>
  )
}

export const useCheckAgent = () => React.useContext(CheckAgentContext)


// ------------ HAS FOUND BOT ------------


export const IdentifiedAgentContext = React.createContext<{
  status: AgentStatus
} | null>(null)

export const useIdentifiedAgent = () => React.useContext(IdentifiedAgentContext)