"use client"

import { Pause, PlayArrow } from "@mui/icons-material"
import { Chip, Stack, Typography } from "@mui/material"
import React from "react"
import { findCurrencyById } from '../utils/data-utils';
import { useIdentifiedAgent } from "./hooks/useCheckAgent"
import DoneAllIcon from '@mui/icons-material/DoneAll';

export function AgentStatusDisplay() {

  const agent = useIdentifiedAgent();

  if (!agent) return <></>

  const { status } = agent
  
  const hasFunds = Number.parseInt(status.baseTokenBalance) > 0

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
            <Stack gap={0.5}>
              <Typography>
                <Typography color="text.secondary" component="span">
                  Target Token{" - "}
                </Typography>
                {findCurrencyById(status?.targetToken)}
              </Typography>
              {/* <Typography>
                <Typography color="text.secondary" component="span">
                  Base Token Reserves:{" "}
                </Typography>
                {botStatus.baseTokenBalance.toString()}
              </Typography> */}
            </Stack>
          </>
        </>
      )}
    </Stack>
  )
}
