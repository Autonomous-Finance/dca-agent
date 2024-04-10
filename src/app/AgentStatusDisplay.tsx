"use client"

import { Pause, PlayArrow } from "@mui/icons-material"
import { Chip, Link, Stack, Typography } from "@mui/material"
import React from "react"
import { findCurrencyById } from '../utils/data-utils';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { credSymbol } from "@/utils/agent-utils";
import AgentInfoUnit from "@/components/AgentInfoUnit";
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider";
import { shortenId } from "@/utils/ao-utils";
import LinkIcon from '@mui/icons-material/Link';


export function AgentStatusDisplay() {

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>
  
  const hasFunds = Number.parseInt(status.quoteTokenBalance) > 0

  const isRetired = status.retired

  return (
    <Stack gap={4} alignItems="flex-start">
      <Typography variant="h4">DCA Agent</Typography>

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

      <Typography variant="body1" fontFamily={'Courier New'}
        sx={{overflowWrap: 'anywhere'}}
        color={'text.primary'}
        >
        <Link href={`https://www.ao.link/entity/${agent.agentId}`} target="_blank"
          sx={(theme) => ({display: 'inline-flex', alignItems: 'center', gap: 1, color: theme.palette.info.main})}>
          {shortenId(agent.agentId)}
          <LinkIcon/>
        </Link>
      </Typography>

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
    </Stack>
  )
}
