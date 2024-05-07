import { AgentStatus, enhanceAgentStatus, getOneRegisteredAgent, readAgentStatus, RegisteredAgent } from "@/utils/agent-utils";
import React from "react";
import { Agent } from "../queries/agent.queries";
import { set } from "date-fns";

export const AGENT_STATUS_POLL_INTERVAL = 4000

export const usePolledAgentStatus = (props: {agentId: string}) => {
  const {agentId} = props
  const [agent, setAgent] = React.useState<AgentStatus & RegisteredAgent | null>(null)
  const [loading, setLoading] = React.useState(true)

  const getAgent = async (id: string) => {
    const respStatusProm = readAgentStatus(id)
    const respRegisteredAgentProm = getOneRegisteredAgent(id)
    const [respStatus, respRegisteredAgent] = await Promise.all([respStatusProm, respRegisteredAgentProm])
    if (respStatus.type === "Success" && respRegisteredAgent.type === "Success") {
      enhanceAgentStatus(respStatus.result!)
      setAgent({
        ...respStatus.result,
        ...respRegisteredAgent.result
      })
    } else {
      console.error("Failed to get agent status", respStatus.result)
    }
  }

  // instant initialization
  React.useEffect(() => {
    const getInitial = async () => {
      await getAgent(agentId)
      setLoading(false)
    }
    getInitial()
  }, [agentId])

  // start polling after interval
  React.useEffect(() => {
    if (!agentId) return;

    const interval = setInterval(() => {
      getAgent(agentId)
    }, AGENT_STATUS_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [agentId])

  return {loading, status: agent, agentId};
}
