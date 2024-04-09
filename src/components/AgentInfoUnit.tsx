import { Box } from '@mui/material'
import React from 'react'

function AgentInfoUnit(props: {children: React.ReactNode}) {

  const COL_WIDTH = 230

  return (
    <Box width={COL_WIDTH}
      // py={1} 
      // px={2} 
    sx={{
      // backgroundColor: 'white',
      // border: '1px solid var(--mui-customColors-layout-softborder-light)',
    }}>
      {props.children}
    </Box>
  )
}

export default AgentInfoUnit