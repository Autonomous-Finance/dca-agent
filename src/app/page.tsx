'use client'

export const dynamic = "force-dynamic"

import { Box, Button, Stack, Typography } from "@mui/material"

import { AgentPanel } from "./AgentPanel"
import React from "react"
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LoadingEmptyState from "@/components/LoadingEmptyState"
import { useLatestAgent } from "@/hooks/useLatestAgent"
import Link from "next/link"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewAgent from "@/components/ViewAgent"
import { wipeRegistry } from "@/utils/agent-utils"

export default function HomePageServer() {
  const latestFromRegistry = useLatestAgent();

  const {agentId, details, loading, refresh} = latestFromRegistry;

  const foundActiveAgent = agentId && !details?.Retired;

  const wipe = async () => {
    await wipeRegistry();
    refresh();
  }
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
              No Active Agent Found.
            </Typography>
            <Stack direction={'row'} gap={4}>
              <Button component={Link} href="/create-agent" size="large" 
                variant="contained" color="success"
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
