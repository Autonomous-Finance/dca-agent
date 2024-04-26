'use client' 

import React from 'react'
import CreateAgent from './CreateAgent'
import { usePools } from '@/hooks/usePools'
import LoadingEmptyState from '@/components/LoadingEmptyState'
import { Box } from '@mui/material'

function CreateAgentPage() {
  const { pools, loading } = usePools()

  return (
    <>
      {loading && (
        <Box mt={'7rem'}>
          <LoadingEmptyState texts={['Fetching Liquidity Pools...']}/>
        </Box>
      )}
      {!loading && <CreateAgent pools={pools}/>}
    </>
  )
}

export default CreateAgentPage