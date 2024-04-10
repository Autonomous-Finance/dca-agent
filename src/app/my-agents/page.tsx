'use client'

import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewAgent from "@/components/ViewAgent";
import AgentsTable from "@/components/AgentsTable";
import ViewListIcon from '@mui/icons-material/ViewList';

export default function MyAgents() {
  const params = useSearchParams();
  const noback = params.get("noback")

  const router = useRouter()

  const navigateBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.back()
  }

  const id = params.get("id")

  const displayAgentPanel = id !== null
  const canGoBack = noback !== "1" && id !== null
  const displayAllAgents = id === null

  // const naviWidth = displayAgentPanel ? 600 + 2*32 : 900
  return (
    <Stack mt={4} gap={4} mx={'auto'} px={'16px'}> 
      <Stack direction={'row'}>
        {!displayAgentPanel && (
          <Button component={Link} href="/create-agent"
            size="large"
            variant="outlined"
            color="success"
            sx={{ fontSize: '1.25rem', marginLeft: 'auto' }}>
            Create Agent <AddCircleOutlineIcon sx={{marginLeft: '0.5rem'}}/>
          </Button>
        )}
        {displayAgentPanel && (
          <>
            {canGoBack && (
              <Button component={Link} href="#" size="large"
                variant="outlined"
                onClick={navigateBack}
                sx={theme => ({
                  fontSize: '1.25rem', 
                  color: `var(--mui-customColors-naviLink-inactive-${theme.palette.mode})`,
                })}>
                <Stack direction={'row'} gap={1} alignItems={'center'}>
                  <ArrowBack/> Back
                </Stack>
              </Button>
            )}
            {!canGoBack && (
              <Button component={Link} href="/my-agents" size="large" 
                variant="outlined"
                sx={{ fontSize: '1.25rem' }}>
                My Agents <ViewListIcon sx={{marginLeft: '0.5rem'}}/>
              </Button>
            )}
          </>
        )}
      </Stack>

      <Divider />

      {displayAgentPanel && (
        <ViewAgent agentId={id} />
      )}
      {displayAllAgents && (
          <AgentsTable/>
        )}
    </Stack>
  )
}