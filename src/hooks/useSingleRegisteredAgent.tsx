import { getOneAgent, RegisteredAgent } from "@/utils/agent-utils"
import { useEffect, useState } from "react"

export const useSingleRegisteredAgent = (id: string | null) => {

  const [registeredAgent, setRegisteredAgent] = useState<RegisteredAgent | null>(null)
  const [isOwn, setIsOwn] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    const getAgent = async () => {
      const user = await window.arweaveWallet?.getActiveAddress()
      setLoading(true)
      getOneAgent(id).then((agentQuery) => {
        setLoading(false)
        const res = agentQuery.result
        if (agentQuery.type === 'Failure') {
          console.log('no agentProcess found', res)
          return
        }
        setRegisteredAgent(res)
        setIsOwn(user === res.Owner)
      })
    }

    getAgent()
}, [id])
  return {registeredAgent, loading, isOwn}
}