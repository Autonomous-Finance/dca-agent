'use client'

export const dynamic = "force-dynamic"

import { Box, Button, Stack, Typography } from "@mui/material"

import { AgentPanel } from "./AgentPanel"
import React from "react"
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LoadingEmptyState from "@/components/LoadingEmptyState"
import { useLatestRegisteredAgent } from "@/hooks/useLatestRegisteredAgent"
import Link from "next/link"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewAgent from "@/components/ViewAgent"
import { wipeRegistry } from "@/utils/agent-utils"

export default function HomePageServer() {
  const latestFromRegistry = useLatestRegisteredAgent();

  const {agentId, details, loading, refresh} = latestFromRegistry;

  const foundActiveAgent = agentId && !details?.Retired;

  const [wiping, setWiping] = React.useState(false);

  const wipe = async () => {
    setWiping(true);
    await wipeRegistry();
    window.location.reload();
  }

  if (wiping) return (
    <Box margin={'8rem auto 0'}>
      <LoadingEmptyState texts={['Wiping Registry...']}/>
    </Box>
  )

  return (
    <>
      <Box margin={'8rem auto 0'}>
        {loading && <LoadingEmptyState texts={['Retrieving your Agents...']}/>}
        {!loading && foundActiveAgent && (
          <ViewAgent agentId={agentId} />
        )}
        {!loading && !foundActiveAgent && (
          <Stack gap={8} mx={'auto'} width={600} height={400} justifyContent={'center'} alignItems={'center'}>
            <Typography variant="h5" align="center" gutterBottom>
              No Recent Active Agent Found.
            </Typography>
            <Stack direction={'row'} gap={4}>
              <Button component={Link} href="/create-agent" size="large" 
                variant="outlined" color="success"
                sx={{ fontSize: '1.25rem' }}>
                Create Agent <AddCircleOutlineIcon sx={{marginLeft: '0.5rem'}}/>
              </Button>
              <Button component={Link} href="/my-agents" size="large" 
                variant="outlined" color="primary"
                sx={{ fontSize: '1.25rem' }}>
                My Agents <ViewListIcon sx={{marginLeft: '0.5rem'}}/>
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
      {/* button fixed bottom right debug */}
      <Button onClick={wipe} variant="outlined" size="large"
        sx={{position: 'fixed', bottom: 0, right: 0, margin: 2, opacity: 0.6}}>
        <CleaningServicesIcon sx={{marginRight: 1}}/> WIPE
      </Button>
    </>
  )
}
