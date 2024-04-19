'use client'

import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"
import ViewAgent from "@/components/ViewAgent";
import ViewListIcon from '@mui/icons-material/ViewList';
import { useSingleRegisteredAgent } from "@/hooks/useSingleRegisteredAgent";
import LoadingEmptyState from "@/components/LoadingEmptyState";

export default function SingleAgent() {
  const params = useSearchParams()
  const noback = params.get("noback")

  const router = useRouter()

  const id = params.get("id")

  const canGoBack = noback !== "1"

  const {loading, isOwn } = useSingleRegisteredAgent(id)

  const displayNotMyAgent = !!id && !loading && !isOwn
  const displayAgentPanel = !!id && !loading && isOwn


  const navigateBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.replace("/my-agents")
  }

  return (
    <Stack mt={2} gap={2} mx={'auto'} px={'16px'} pt={'2rem'} position={'relative'}> 
      <Box position={'absolute'} width={'100%'}>

        {canGoBack && (
          <Button component={Link} href="#"
            variant="outlined"
            size="small"
            onClick={navigateBack}
            sx={[
              theme => ({
                backgroundColor: theme.palette.mode === 'dark' ? 'var(--mui-palette-primary-contrastText)' : 'var(--mui-palette-primary-contrastText)',
                fontSize: '1.25rem', marginRight: 'auto', 
                color: `var(--mui-customColors-naviLink-inactive-${theme.palette.mode})`,
              }),
              theme => ({
                '&:hover' : {
                  color: theme.palette.mode === 'dark' ? 'var(--mui-palette-primary-light)' : 'var(--mui-palette-primary-dark)',
                  backgroundColor: theme.palette.mode === 'dark' ? 'var(--mui-palette-primary-contrastText)' : 'var(--mui-palette-primary-contrastText)'
                }
              })
              ]}>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <ArrowBack/> Back
            </Stack>
          </Button>
        )}
      </Box>

      <Box>
        {loading && (
          <Box margin={'4rem auto 0'}>
            <LoadingEmptyState texts={['Loading status...']}/>
          </Box>
        )}

        {displayNotMyAgent && (
          <Box height={400} display={'flex'} gap={4}
            alignItems={'center'} justifyContent={'center'} flexDirection={'column'}
          >
            <Typography variant="h5">
              You do not own this agent.
            </Typography>
          </Box>
        )}

        {displayAgentPanel && (
          <ViewAgent agentId={id} />
        )}
      </Box>

    </Stack>
  )
}