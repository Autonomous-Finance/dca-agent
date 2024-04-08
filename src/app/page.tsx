'use client'

export const dynamic = "force-dynamic"

import { Box, Button } from "@mui/material"

import { CreateBot } from "./CreateBot"
import { BotPanel } from "./BotPanel"
import React from "react"
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LoadingHome from "@/components/LoadingHome"
import { IdentifiedBotContext, useCheckBot } from "./hooks/useCheckBot"

export default function HomePageServer() {
  const latestBot = useCheckBot();

  if (!latestBot) return <></>

  const {status, loading} = latestBot;


  const cleanupForNewBot = () => {
    window.localStorage.setItem('botProcess', '')
    window.location.reload()
  }

  return (
    <>
      <Box margin={'6rem auto 0'}>
        {loading && <LoadingHome/>}
        {!loading && (
          <>
            {!status && ( <CreateBot checkOutDeployedBot={latestBot.updateStatus}/> )}
            {status && (
              <IdentifiedBotContext.Provider value={latestBot}>
                <BotPanel />
              </IdentifiedBotContext.Provider>
            )} 
          </>
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
