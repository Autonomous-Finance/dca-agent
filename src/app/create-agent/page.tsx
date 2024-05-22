'use client' 

import React from 'react'
import CreateAgent from './CreateAgent'
import { usePools } from '@/hooks/usePools'
import LoadingEmptyState from '@/components/LoadingEmptyState'
import { Box, Link, Stack, Typography } from '@mui/material'
import Image from 'next/image'

function CreateAgentPage() {
  const { pools, loading } = usePools()
  debugger

  const dexi = (
    <Typography display={'flex'} flexDirection={'row'} gap={1} alignItems={'center'} fontSize={'1.5rem'}>
      <Box py={'1px'} px={'1px'} bgcolor={'#333'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
        <Box sx={{filter: 'invert(1) saturate(0) contrast(1.2)'}} display={'flex'} alignItems={'center'}><Image alt="icon" width={64} height={64} src={'/dexi.svg'}/></Box>
      </Box>
    </Typography>
  )

  return (
    <>
      {loading && (
        <Box mt={'7rem'}>
          <LoadingEmptyState post={dexi} texts={['Fetching Liquidity Pools...']}/>
        </Box>
      )}
      {!loading && <CreateAgent pools={pools}/>}
    </>
  )
}

export default CreateAgentPage