import React from 'react'

import { Pause, PlayArrow } from "@mui/icons-material"
import { Box, Chip } from "@mui/material"
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { AgentStatusX } from '@/utils/agent-utils';
import HelpIcon from './HelpIcon';


function AgentStatusChip({statusX, large, noIcon }: {statusX: AgentStatusX, large?: boolean, noIcon?: boolean}) {
  const sx = large
    ? {
      padding: '1rem 1rem',
      fontSize: '1.25rem',
      fontWeight: 'medium'
    }
    : {
      padding: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold'
    }

  const helpText = statusX === 'No Funds' ? 'Agent is active but has insufficient funds to perform DCA orders.' : ''

  return (
    <Box position={'relative'}>
      {large && helpText && (
        <Box position={'absolute'} left={0} top={0} height={'100%'} 
          display={'flex'} alignItems={'center'} justifyContent={'center'}
          sx={{
            transform: 'translateX(calc(-100% - 0.5rem))',
          }}>
          <HelpIcon text={helpText}/>
        </Box>
      )}
      {statusX === 'Active' && (
        <Chip label="Active" variant="outlined" color="success" 
            icon={noIcon ? <></> : <PlayArrow />} 
            sx={sx}
          />
      )}
      {statusX === 'Retired' && (
        <Chip label="Retired" variant="outlined" color="primary" 
            icon={noIcon ? <></> : <DoneAllIcon />} 
            sx={sx} 
        />
      )}
      {statusX === 'No Funds' && (
        <Chip label="No Funds" variant="outlined" color="warning" 
            icon={noIcon ? <></> : <Pause />} 
            sx={sx}  
        />
      )}
    </Box>
  )
}

export default AgentStatusChip