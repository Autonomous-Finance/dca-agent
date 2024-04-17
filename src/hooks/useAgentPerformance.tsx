import { AgentPerformance, AgentStatus, createAgentPerformanceInfo, getCurrentSwapBackOutput, getCurrentSwapOutput, RegisteredAgent } from "@/utils/agent-utils";
import React from "react";


export const useAgentPerformance = (props: {agentStatus: AgentStatus & RegisteredAgent | null}) => {
  const {agentStatus} = props
  const [performanceInfo, setPerformanceInfo] = React.useState<AgentPerformance | null>(null)
  const [loading, setLoading] = React.useState(true)

  const getInfo = async () => {
    if (agentStatus) {
      const respCurrentSwapOutProm = getCurrentSwapOutput(agentStatus)
      const respCurrentSwapBackOutProm = getCurrentSwapBackOutput(agentStatus)
      const [respCurrentSwapOut, respCurrentSwapBackOut] = await Promise.all([respCurrentSwapOutProm, respCurrentSwapBackOutProm])
      if (respCurrentSwapOut) {
        setPerformanceInfo(
          createAgentPerformanceInfo(
            respCurrentSwapOut,
            agentStatus,
            respCurrentSwapBackOut
          )
        )
      } else {
        console.error("Failed to get current swap output")
      }
    }
  }

  // instant initialization
  React.useEffect(() => {
    const getInitial = async () => {
      await getInfo()
      setLoading(false)
    }
    getInitial()
  }, [agentStatus?.Agent])

  // start polling after interval
  React.useEffect(() => {
    if (!agentStatus?.Agent) return;

    const interval = setInterval(() => {
      getInfo()
    }, 12000)

    return () => clearInterval(interval)
  }, [agentStatus?.Agent])

  return {loading, performanceInfo};
}
