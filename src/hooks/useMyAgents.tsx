import { getAllAgents } from "@/utils/agent-utils";
import React from "react";
import { RegisteredAgent } from "./useLatestAgent";

export const useMyAgents = () => {

  const [agentInfos, setAgentInfos] = React.useState<RegisteredAgent[] | null>(null);
  const [loading, setLoading] = React.useState(true)

  const getAgents = async () => {
    try {
      const agentsQuery = await getAllAgents()

      if (agentsQuery.type === 'Failure') {
        console.log('could not retrieve agents')
        setLoading(false)
        return
      }
      
      setAgentInfos(agentsQuery.result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    getAgents()
  }, []);

 
  const refresh = async () => {
    setLoading(true)
    await getAgents()
  }

  return {loading, agentInfos, refresh}
}
