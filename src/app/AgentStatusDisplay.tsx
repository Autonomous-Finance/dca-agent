"use client"

import { Box, Button, Divider, Link, Paper, Stack, Typography } from "@mui/material"
import React, { ReactNode, useEffect, useState } from "react"
import { enhanceAgentStatus, enhanceRegisteredAgentInfo, getCurrentSwapOutput, getTotalValue } from "@/utils/agent-utils";
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider";
import { shortenId } from "@/utils/ao-utils";
import LinkIcon from '@mui/icons-material/Link';
import AgentStatusChip from "@/components/AgentStatusChip";
import HelpIcon from "@/components/HelpIcon";
import { East, WaterDrop } from "@mui/icons-material";
import SwapDebug from "@/components/SwapDebug";
import { useAgentPerformance } from "@/hooks/useAgentPerformance";
import { displayableCurrency } from "@/utils/data-utils";


const HELP_TEXT_SPR = 'Strategy Performance Ratio (SPR) reflects the performance of the agent. Calculated as the inverse ratio between the hypothetical costs of buying the same amount of base tokens right now and the effective historical costs of buying them via DCA.'
const HELP_TEXT_TOTAL_DEPOSITED = 'Total amount of quote tokens deposited to the agent.'
const HELP_AVG_SWAP_PRICE = 'Your historical average swap price (base token for quote token).'
const HELP_CURRENT_SWAP_PRICE = 'Current price for a swap (base token for quote token) with your configured quote token amount.'

export function AgentStatusDisplay() {
  const agent = usePolledAgentStatusContext()

  const agentPerformance = useAgentPerformance({agentStatus: agent?.status || null});

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  enhanceAgentStatus(status)
  enhanceRegisteredAgentInfo(status)

  const agentPerformanceInfo = agentPerformance?.performanceInfo || null

  const currentValue = agentPerformanceInfo
    ? getTotalValue(status.quoteTokenBalance, agentPerformanceInfo.currentSwapBackOutput)
    : null

  return (
    <Stack gap={4} alignItems="flex-start">
      <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} width={'100%'}>
        <Typography variant="h4">
          Agent{" "}
          <Typography variant="h4" component="span" fontFamily={'Courier New'} fontWeight={'bold'}>
            {status.agentName}
          </Typography>
        </Typography>
        <AgentStatusChip statusX={status.statusX!} large />
      </Stack>

      <Stack direction={'row'} width={'100%'}>
        <Stack flex={'grow'} width={'100%'} gap={2}>
          <Typography display={'flex'} fontWeight={'bold'}>
            IDENTITY
          </Typography>
          <InfoLine
            label={'Process ID'} 
            value={
              <Link href={`https://www.ao.link/entity/${agent.agentId}`} target="_blank"
                variant="body1" fontFamily={'Courier New'}
                color={'text.primary'}
                sx={(theme) => ({
                  overflowWrap: 'anywhere',
                  display: 'inline-flex', 
                  alignItems: 'center', gap: 1, 
                  color: theme.palette.info.main
                  })}
                >
                {shortenId(agent.agentId)}
                <LinkIcon/>
              </Link>
            }
          ></InfoLine>
          <InfoLine
            label={'Owned since'} 
            value={status.ownedSince}
            soft
          ></InfoLine>
          <InfoLine
            label={'Provenance'} 
            value={status.provenance}
            soft
          ></InfoLine>

          <Typography mx='auto' display={'flex'} sx={{opacity: 0}}>
            -
          </Typography>
          <Box my={'12px'}><Divider /></Box>

          <Typography display={'flex'} fontWeight={'bold'}>
            ASSETS
          </Typography>
          <InfoLine label={'Base Balance'} value={`${displayableCurrency(status.baseTokenBalance)}`} suffix={status.baseTokenSymbol}
            />
          <InfoLine label={'Quote Balance'} 
            value={`${displayableCurrency(status.quoteTokenBalance)}`} 
            suffix={status.quoteTokenSymbol}
            color={status.statusX === 'No Funds' ? 'var(--mui-palette-error-main)' : ''}
          />
          <InfoLine label={'Total Value (est.)'}
            value={currentValue ? displayableCurrency(currentValue) : `n/A`} 
            suffix={currentValue ? status.quoteTokenSymbol : ''}
            soft={!currentValue}
          />
          <Box sx={{marginTop: 'auto', marginRight: 'auto', marginLeft: 'auto'}}>
            <SwapDebug />
          </Box>
        </Stack>
        <Box px={2}>
          {/* <Divider orientation="vertical"/> */}
        </Box>
        <Stack flex={'grow'} width={'100%'} gap={2}>
          <Typography display={'flex'} fontWeight={'bold'}>
            DCA CONFIG
          </Typography>
          <InfoLine label='Currencies' value={
            <Typography display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1} width={'100%'} fontWeight={'medium'}>
              {status.quoteTokenSymbol} <East /> {status.baseTokenSymbol}
            </Typography>}/>
          <InfoLine label={'Swap Interval'} value={`${status.swapIntervalValue}`} suffix={status.swapIntervalUnit}></InfoLine>
          <InfoLine label={'Swap Amount'} value={`${displayableCurrency(status.swapInAmount)}`} suffix={status.quoteTokenSymbol}></InfoLine>
          <InfoLine label={'Max Slippage'} value={`${status.slippageTolerance }`} suffix={'%'}></InfoLine>
          
          <Box my={'12px'}><Divider /></Box>

          <Typography display={'flex'} fontWeight={'bold'}>
            STATS
          </Typography>
          <InfoLine label={'Total Deposited'}
            value={displayableCurrency(status.TotalDeposited)}
            suffix={status.quoteTokenSymbol}
            labelInfo={HELP_TEXT_TOTAL_DEPOSITED}
          />
          <InfoLine label={'Total Swaps (Active Cycles)'} value={status.DcaBuys.length} />
          <InfoLine label={'Average Swap Price'}
            value={status.averagePrice || 'n/A'}
            suffix={status.averagePrice ? status.quoteTokenSymbol : ''}
            soft={!status.averagePrice}
            labelInfo={HELP_AVG_SWAP_PRICE}
          />
          <InfoLine label={'Current Swap Price'}
            value={agentPerformanceInfo?.currentPrice || `n/A`}
            suffix={agentPerformanceInfo?.currentPrice ? status.quoteTokenSymbol : ''}
            soft={!agentPerformanceInfo?.currentPrice}
            labelInfo={HELP_CURRENT_SWAP_PRICE}
          />
          <InfoLine label={'SPR'}
            value={agentPerformanceInfo?.spr || `n/A`} 
            suffix={agentPerformanceInfo?.spr ? '%' : ''}
            soft={!agentPerformanceInfo?.spr}
            labelInfo={HELP_TEXT_SPR}
          />          
                   
        </Stack>
      </Stack>
    </Stack>
  )
}

const InfoLine = (props: {label: string, value: ReactNode, suffix?: string, labelInfo?: string, color?: string, soft?: boolean}) => {
  return (
    <Stack direction={'row'} justifyContent={'space-between'} gap={2}>
      <Typography variant="body1" display={'flex'} alignItems={'center'}
        sx={{color: props.color || 'text.secondary'}}
      >
        {props.label} {props.labelInfo && <HelpIcon text={props.labelInfo}/>}
      </Typography>
      <Stack direction={'row'} gap={1}>
        {typeof props.value === 'string' && (
          <Typography variant="body1" fontWeight={props.soft ? 'normal' : 'bold'}>
            {props.value}
          </Typography>
        )}
        {typeof props.value !== 'string' && (
          <Typography variant="body1">
            {props.value}
          </Typography>
        )}
        {props.suffix && <Typography variant="body1"
        >
          {props.suffix}
        </Typography>}
      </Stack>
    </Stack>
  )
}
