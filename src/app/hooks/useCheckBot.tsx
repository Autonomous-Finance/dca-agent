import { BotStatus, BotStatusNonInit, readBotStatus } from "@/utils/bot-utils";
import React from "react";

const useBot = () => {

  const [status, setStatus] = React.useState<BotStatus | BotStatusNonInit | null>(null);
  const [polling, setPolling] = React.useState(false);
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    readBotStatus().then((resp) => {
      setStatus(resp)
      setLoading(false)
      setPolling(!!resp && resp.initialized)
    })
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const update = async () => {
        if (!polling) return // if no active bot exists, no polling should occur
        const status = await readBotStatus()
        setLoading(false)
        if (status?.initialized) {
          setStatus(status)
        }
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
    // still loading or no bot found or bot not initialized (can discard case for mvp)
    return {loading, status: null, updateStatus}
  }

  return {loading, status};
}

// ------------ CHECKS FOR BOT ------------

const CheckBotContext = React.createContext<{
  loading: boolean,
  status: null,
  updateStatus: () => void
} | {
  loading: false,
  status: BotStatus,
} | null>(null)

export const CheckBotProvider = ({children}: { children: React.ReactNode }) => {
  const bot = useBot()
  return (
    <CheckBotContext.Provider value={bot}>
      {children}
    </CheckBotContext.Provider>
  )
}

export const useCheckBot = () => React.useContext(CheckBotContext)


// ------------ HAS FOUND BOT ------------


export const IdentifiedBotContext = React.createContext<{
  status: BotStatus
} | null>(null)

export const useIdentifiedBot = () => React.useContext(IdentifiedBotContext)