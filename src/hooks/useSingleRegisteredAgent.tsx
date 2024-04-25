import { getOneRegisteredAgent, RegisteredAgent } from "@/utils/agent-utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export const useSingleRegisteredAgent = (id: string | null) => {

  const [registeredAgent, setRegisteredAgent] = useState<RegisteredAgent | null>(null)
  const [isOwn, setIsOwn] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    const getAgent = async () => {
      const user = await window.arweaveWallet?.getActiveAddress()
      setLoading(true)
      getOneRegisteredAgent(id).then((agentQuery) => {
        setLoading(false)
        const res = agentQuery.result
        if( agentQuery.type === 'Failure' && agentQuery.result === "Uninitialized") {
          setIsInitialized(false)
          router.replace(`/create-agent?agentId=${id}&noback=1`)
          return
        }
        if (agentQuery.type === 'Failure') {
          console.log('no agentProcess found', res)
          return
        }
        setRegisteredAgent(res)
        setIsOwn(user === res.Owner)
      })
    }

    getAgent()
}, [id, router])

  return {registeredAgent, loading, isOwn, isInitialized}
}
