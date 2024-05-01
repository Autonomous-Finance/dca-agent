'use client'

import { Button, CircularProgress } from '@mui/material'
import React from 'react'
import { enhanceAgentStatus, resetProgressFlags } from '@/utils/agent-utils';
import { BugReport } from '@mui/icons-material';
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import RefreshIcon from '@mui/icons-material/Refresh';

function ResetProgress() {
  const agent = usePolledAgentStatusContext();
  const [loading, setLoading] = React.useState(false)

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  enhanceAgentStatus(status)

  const reset = async () => {
    setLoading(true)
    await resetProgressFlags(agent.agentId)
    setLoading(false)
    window.location.reload()
  }

  return (
    <Button onClick={reset} variant="outlined"
      sx={{opacity: 0.6}}>
      <RefreshIcon/> Reset <BugReport/> {loading && <CircularProgress size={14} sx={{marginLeft: '0.5rem'}} /> }
    </Button>
  )
}

export default ResetProgress