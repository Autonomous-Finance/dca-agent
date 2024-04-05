import { Box, CircularProgress, Typography } from '@mui/material'
import Image from 'next/image'
import React from 'react'

function LoadingHome() {
  return (
    <Box position={'relative'} height={400} display={'flex'} gap={4}
      alignItems={'center'} justifyContent={'center'} flexDirection={'column'}
      >
      <Box position={'absolute'} left={0} top={0} width={'100%'} height={'100%'}
        display={'flex'} alignItems={'center'} justifyContent={'center'}
        sx={{opacity: 0.05}}
        >
        <Image alt="icon" width={600} height={600} src={'/ao.svg'} />
      </Box>
      <CircularProgress size={64} />
    </Box>
  )
}

export default LoadingHome