import { Button } from '@mui/material'
import React from 'react'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { swapDebug } from '@/utils/agent-utils';
import { BugReport } from '@mui/icons-material';

function SwapDebug() {

  return (
    <Button onClick={swapDebug} variant="outlined"
      sx={{opacity: 0.6}}>
      <SwapHorizIcon sx={{marginRight: 1}}/> MANUAL SWAP <BugReport sx={{marginLeft: 1}}/>
    </Button>
  )
}

export default SwapDebug