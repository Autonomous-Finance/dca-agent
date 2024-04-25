import { AgentPerformance, AgentStatus, createAgentPerformanceInfo, getCurrentSwapBackOutput, getCurrentSwapOutput, RegisteredAgent } from "@/utils/agent-utils";
import React from "react";


export const AGENT_PERFORMANCE_POLL_INTERVAL = 5000

export const useAgentPerformance = (props: {agentStatus: AgentStatus & RegisteredAgent | null}) => {
  const {agentStatus} = props
  const {pool, quoteToken, swapInAmount, baseToken, baseTokenBalance, averagePrice} = agentStatus || {}
  const [performanceInfo, setPerformanceInfo] = React.useState<AgentPerformance | null>(null)
  const [initialized, setInitialized] = React.useState(false)
  const [tick, setTick] = React.useState(0)
  const [loading, setLoading] = React.useState(true)


  // instant initialization
  React.useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), AGENT_PERFORMANCE_POLL_INTERVAL)
    
    const getInitial = async () => {
      // run exactly once, when all values are available
      if (pool && quoteToken && swapInAmount && baseToken && baseTokenBalance && !initialized) {
        setInitialized(true)
        const respCurrentSwapOutProm = getCurrentSwapOutput(pool!, quoteToken!, swapInAmount!)
        const respCurrentSwapBackOutProm = getCurrentSwapBackOutput(pool!, baseToken!, baseTokenBalance!)
        const [respCurrentSwapOut, respCurrentSwapBackOut] = await Promise.all([respCurrentSwapOutProm, respCurrentSwapBackOutProm])
        if (respCurrentSwapOut) {
          setPerformanceInfo(
            createAgentPerformanceInfo(
              respCurrentSwapOut,
              respCurrentSwapBackOut,
              swapInAmount,
              averagePrice
            )
          )
        } else {
          console.error("Failed to get current swap output & calc performance data")
        }
        setLoading(false)
      }
    }
    getInitial()

    return () => clearInterval(interval)
  }, [pool, quoteToken, swapInAmount, baseToken, baseTokenBalance, initialized])


  // start polling after interval
  React.useEffect(() => {
    if (!initialized || tick === 0) return

    const update = async () => {
      if (pool && quoteToken && swapInAmount && baseToken && baseTokenBalance) {
        const respCurrentSwapOutProm = getCurrentSwapOutput(pool!, quoteToken!, swapInAmount!)
        const respCurrentSwapBackOutProm = getCurrentSwapBackOutput(pool!, baseToken!, baseTokenBalance!)
        const [respCurrentSwapOut, respCurrentSwapBackOut] = await Promise.all([respCurrentSwapOutProm, respCurrentSwapBackOutProm])
        if (respCurrentSwapOut) {
          setPerformanceInfo(
            createAgentPerformanceInfo(
              respCurrentSwapOut,
              respCurrentSwapBackOut,
              swapInAmount,
              averagePrice
            )
          )
        } else {
          console.error("Failed to get current swap output & calc performance data")
        }
      }
    }

    update()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, quoteToken, swapInAmount, baseToken, baseTokenBalance, initialized, tick])

  return {loading, performanceInfo};
}
