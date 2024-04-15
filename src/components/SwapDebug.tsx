'use client'

import { Button } from '@mui/material'
import React from 'react'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { enhanceAgentStatus } from '@/utils/agent-utils';
import { BugReport } from '@mui/icons-material';
import { usePolledAgentStatusContext } from './PolledAgentStatusProvider';
import { swapDebug } from '../utils/agent-utils';

function SwapDebug() {
  const [loading, setLoading] = React.useState(false)

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  enhanceAgentStatus(status)

  const swap = async () => {
    setLoading(true)
    const result = await swapDebug(agent.agentId)
    setLoading(false)
    if (result?.type === "Success") {
      const msgId = result.result
      console.log('swap triggered. msgId: ', msgId)
    } else {
      console.log('swap trigger failed', result?.result)
    }
  }

  return (
    <Button onClick={swap} variant="outlined"
      sx={{opacity: 0.6}}>
      <SwapHorizIcon sx={{marginRight: 1}}/> MANUAL SWAP <BugReport sx={{marginLeft: 1}}/>
    </Button>
  )
}

export default SwapDebug