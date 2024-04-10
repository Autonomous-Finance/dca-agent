import { AgentStatus, getLatestAgent, readAgentStatus } from "@/utils/agent-utils";
import React from "react";
import { Agent } from "../queries/agent.queries";
import { set } from "date-fns";


export const usePolledAgentStatus = (props: {agentId: string}) => {
  const {agentId} = props
  const [status, setStatus] = React.useState<AgentStatus | null>(null)
  const [loading, setLoading] = React.useState(true)

  const getStatus = async (id: string) => {
    const resp = await readAgentStatus(id)
    if (resp.type === "Success") {
      setStatus(resp.result)
    } else {
      console.error("Failed to get agent status", resp.result)
    }
  }

  // instant initialization
  React.useEffect(() => {
    const getInitial = async () => {
      await getStatus(agentId)
      setLoading(false)
    }
    getInitial()
  }, [agentId])

  // start polling after interval
  React.useEffect(() => {
    if (!agentId) return;

    const interval = setInterval(() => {
      getStatus(agentId)
    }, 3000)

    return () => clearInterval(interval)
  }, [agentId])

  return {loading, status, agentId};
}
