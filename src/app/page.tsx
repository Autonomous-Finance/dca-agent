'use client'

export const dynamic = "force-dynamic"

import { Box, Button } from "@mui/material"

import { CreateAgent } from "./CreateAgent"
import { AgentPanel } from "./AgentPanel"
import React from "react"
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LoadingHome from "@/components/LoadingHome"
import { IdentifiedAgentContext, useCheckAgent } from "./hooks/useCheckAgent"

export default function HomePageServer() {
  const latestAgent = useCheckAgent();

  if (!latestAgent) return <></>

  const {status, loading} = latestAgent;

  const cleanupForNewBot = () => {
    window.localStorage.setItem('agentProcess', '')
    window.location.reload()
  }

  return (
    <>
      <Box margin={'6rem auto 0'}>
        {loading && <LoadingHome/>}
        {!loading && (
          <>
            {!status && ( <CreateAgent checkOutDeployedAgent={latestAgent.updateStatus}/> )}
            {status && (
              <IdentifiedAgentContext.Provider value={latestAgent}>
                <AgentPanel />
              </IdentifiedAgentContext.Provider>
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
          Clear Agent
        </Button>
      </Box>
    </>
  )
}
