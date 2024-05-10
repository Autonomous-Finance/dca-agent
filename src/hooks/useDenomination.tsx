import React, { useEffect } from "react"
import { getTokenInfo } from "./usePools"

export const useDenomination = (tokenProcessId: string | undefined) => {
  const [denomination, setDenomination] = React.useState<number>(3)

  useEffect(() => {
    if (!tokenProcessId) return
    const getInfo = async () => {
      const tokenInfo = await getTokenInfo(tokenProcessId)
      setDenomination(tokenInfo.denomination)
    }

    getInfo()
  }, [tokenProcessId])

  return denomination
}