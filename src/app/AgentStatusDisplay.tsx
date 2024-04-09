"use client"

import { Pause, PlayArrow } from "@mui/icons-material"
import { Chip, Stack, Typography } from "@mui/material"
import React from "react"
import { findCurrencyById } from '../utils/data-utils';
import { useIdentifiedAgent } from "./hooks/useCheckAgent"
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { credSymbol } from "@/utils/agent-utils";
import AgentInfoUnit from "@/components/AgentInfoUnit";

export function AgentStatusDisplay() {

  const agent = useIdentifiedAgent();

  if (!agent) return <></>

  const { status } = agent
  
  const hasFunds = Number.parseInt(status.quoteTokenBalance) > 0

  const isRetired = status.retired

  return (
    <Stack gap={4} alignItems="flex-start">
      <Typography variant="h4">DCA Agent</Typography>
      {agent !== null && (
        <>
        {/* TODO handle states properly */}
          <>
            {hasFunds && (
              <Chip label="Active" variant="outlined" color="success" 
                  icon={<PlayArrow />} 
                  sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}}
                />
            )}
            {isRetired && (
              <Chip label="Retired" variant="outlined" color="primary" 
                  icon={<DoneAllIcon />} 
                  sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}} 
              />
            )}
            {!hasFunds && !isRetired && (
              <Chip label="No Funds" variant="outlined" color="warning" 
                  icon={<Pause />} 
                  sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}}  
              />
            )}
            <AgentInfoUnit>
              <Stack gap={0.5}  >
                <Typography component="span" display={'flex'} justifyContent={'space-between'}>
                  <Typography color="text.secondary">
                    Quote
                  </Typography> 
                  {credSymbol}
                </Typography>
              
                <Typography component="span" display={'flex'} justifyContent={'space-between'}>
                  <Typography color="text.secondary">
                    Base
                  </Typography> 
                  {findCurrencyById(status?.baseToken)}
                </Typography>
              </Stack>
            </AgentInfoUnit>
          </>
        </>
      )}
    </Stack>
  )
}
