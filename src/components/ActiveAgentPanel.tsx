import LoadingEmptyState from '@/components/LoadingEmptyState';
import React from 'react'
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import { AgentPanel } from '@/app_deprecated/AgentPanel';
import { usePathname } from 'next/navigation';
import { Box, Typography } from '@mui/material';

function ActiveAgentPanel() {
  const agent = usePolledAgentStatusContext();
  const pathname = usePathname()
  const isDashboard = pathname === '/'

  const texts = ['Loading status...']
  if (isDashboard) {
    texts.unshift('You have an active agent.')
  }

  const loading = agent?.loading
  const status = agent?.status

  

  return (
    <>
      {(loading) && (
        <Box margin={isDashboard ? '7rem auto 0' : '4rem auto 0'}>
          <LoadingEmptyState texts={texts}/>
        </Box>
      )}
      {(!loading && !status) && (
        <Box position={'relative'} height={400} display={'flex'} gap={4}
        alignItems={'center'} justifyContent={'center'} flexDirection={'column'}
        >
          <Typography variant="h5" align="center" gutterBottom>
            {"Couldn't read status"}
          </Typography>
        </Box>
      )}
      {status && ( <AgentPanel /> )}
    </>
  )
}

export default ActiveAgentPanel