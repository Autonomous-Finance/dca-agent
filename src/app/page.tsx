'use client'

export const dynamic = "force-dynamic"

import { Box, Button } from "@mui/material"

import { CreateBot } from "./CreateBot"
import { ActiveBot } from "./ActiveBot"
import React, { useEffect } from "react"
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { BotStatus, BotStatusNonInit, readBotStatus } from "@/utils/bot-utils"
import LoadingHome from "@/components/LoadingHome"

export default function HomePageServer() {
  // return <DeployContract />

  const [botStatus, setBotStatus] = React.useState<BotStatus | BotStatusNonInit | null>(null)
  const [loading, setLoading] = React.useState(true)

  useEffect(() => {
    readBotStatus().then((resp) => {
      setBotStatus(resp)
      setLoading(false)
    })
  }, []);

  const updateStatus = async () => {
    setLoading(true)
    const status = await readBotStatus()
    setBotStatus(status)
    setLoading(false)
  }

  const cleanupForNewBot = () => {
    window.localStorage.setItem('botProcess', '')
    window.location.reload()
  }

  if (botStatus && !botStatus.initialized) {
    cleanupForNewBot()
  }

  return (
    <>
      <Box margin={'6rem auto 0'} maxWidth={600}>
        {loading && <LoadingHome/>}
        {!loading && !botStatus && (
            <CreateBot checkOutDeployedBot={updateStatus}/>
        )}
        {!loading && botStatus && botStatus.initialized && (
            <ActiveBot initialBotStatus={botStatus} />
        )} 
      </Box>

      {/* for debugging while wip */}
      <Box position={'fixed'} right={'2rem'} bottom={'2rem'}>
        <Button onClick={cleanupForNewBot}
          variant='outlined'
          color="primary"
          startIcon={<CleaningServicesIcon />}
          >
          Clear Bot
        </Button>
      </Box>
    </>
  )
}
