"use client"

import { Box, Divider, Link, Stack, Tooltip, Typography, Zoom } from "@mui/material"
import React, { ReactNode } from "react"
import { enhanceAgentStatus, enhanceRegisteredAgentInfo, getTotalValue } from "@/utils/agent-utils";
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider";
import { shortenId } from "@/utils/ao-utils";
import LinkIcon from '@mui/icons-material/Link';
import AgentStatusChip from "@/components/AgentStatusChip";
import HelpIcon from "@/components/HelpIcon";
import { Close, East, MoreHoriz, } from "@mui/icons-material";
import SwapDebug from "@/components/SwapDebug";
import { useAgentPerformance } from "@/hooks/useAgentPerformance";
import { displayableCurrency, truncateId } from "@/utils/data-utils";


const HELP_TEXT_SPR = 'Strategy Performance Ratio (SPR) reflects the performance of the agent. Calculated as the inverse ratio between the hypothetical costs of buying the same amount of base tokens right now and the effective historical costs of buying them via DCA.'
const HELP_TEXT_TOTAL_DEPOSITED = 'Total amount of quote tokens deposited to the agent.'
const HELP_AVG_SWAP_PRICE = 'Your historical average swap price (base token for quote token).'
const HELP_CURRENT_SWAP_PRICE = 'Current price for a swap (base token for quote token) with your configured quote token amount.'

export function AgentStatusDisplay({loading} : {loading: boolean}) {
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
      <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} width={'100%'} mb={2}>
        <Typography variant="h4">
          Agent{" "}
          <Typography variant="h4" component="span" fontFamily={'Courier New'} fontWeight={'bold'}>
            {status.agentName}
          </Typography>
        </Typography>
      </Stack>

      <Stack width={'100%'} direction={'row'} gap={4} justifyContent={'space-between'}>
        <Stack gap={2} width={'100%'}>
          <Box width={'100%'}>
            <InfoLine large label='Currencies' value={
              <Typography display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1} width={'100%'} fontWeight={'medium'} fontSize={'1.25rem'}>
                {status.quoteTokenTicker} <East /> {status.baseTokenTicker}
              </Typography>}/>
          </Box>
          <Box width={'100%'}>
            <InfoLine large label='Pools' value={
              <Typography display={'flex'} alignItems={'center'} justifyContent={'space-between'} flexDirection={'row'} gap={1} width={'100%'} fontSize={'1.25rem'} fontWeight={'medium'} >
                {status.dex}
                <PoolsDetails agent={agent.status}/>
              </Typography>
              }
            />
          </Box>
        </Stack>
        <Box width={'100%'} display={'flex'} alignItems={'flex-start'}>
          <InfoLine large label={'Status'} value={<AgentStatusChip statusX={status.statusX!} large />} />
        </Box>
      </Stack>

      <Divider flexItem/>

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
          />
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
        </Stack>
        <Box px={2}>
          {/* <Divider orientation="vertical"/> */}
        </Box>
        <Stack flex={'grow'} width={'100%'} gap={2}>
          <Typography display={'flex'} fontWeight={'bold'}>
            DCA CONFIG
          </Typography>
          <InfoLine label={'Swap Interval'} value={`${status.swapIntervalValue}`} suffix={status.swapIntervalUnit}/>
          <InfoLine label={'Swap Amount'} value={`${displayableCurrency(status.swapInAmount)}`} suffix={status.quoteTokenTicker}/>
          <InfoLine label={'Max Slippage'} value={`${status.slippageTolerance }`} suffix={'%'}/>                 
        </Stack>
      </Stack>

      <Divider flexItem/>

      <Stack direction={'row'} flex={'grow'} width={'100%'} sx={{opacity: loading ? '0.3' : '1'}}>
        <Stack flex={'grow'} width={'100%'} gap={2}>
          <Typography display={'flex'} fontWeight={'bold'}>
            ASSETS
          </Typography>
          <InfoLine label={'Base Balance'} value={`${displayableCurrency(status.baseTokenBalance)}`} suffix={status.baseTokenTicker}
            />
          <InfoLine label={'Quote Balance'} 
            value={`${displayableCurrency(status.quoteTokenBalance)}`} 
            suffix={status.quoteTokenTicker}
            color={status.statusX === 'No Funds' ? 'var(--mui-palette-error-main)' : ''}
          />
          <InfoLine label={'Total Value (est.)'}
            value={currentValue ? displayableCurrency(currentValue) : `n/A`} 
            suffix={currentValue ? status.quoteTokenTicker : ''}
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
            STATS
          </Typography>
          <InfoLine label={'Total Deposited'}
            value={displayableCurrency(status.TotalDeposited)}
            suffix={status.quoteTokenTicker}
            labelInfo={HELP_TEXT_TOTAL_DEPOSITED}
          />
          <InfoLine label={'Total Swaps (Active Cycles)'} value={status.DcaBuys.length} />
          <InfoLine label={'Average Swap Price'}
            value={status.averagePrice || 'n/A'}
            suffix={status.averagePrice ? status.quoteTokenTicker : ''}
            soft={!status.averagePrice}
            labelInfo={HELP_AVG_SWAP_PRICE}
          />
          <InfoLine label={'Current Swap Price'}
            value={agentPerformanceInfo?.currentPrice || `n/A`}
            suffix={agentPerformanceInfo?.currentPrice ? status.quoteTokenTicker : ''}
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

const InfoLine = (props: {label: string, value: ReactNode, suffix?: string, labelInfo?: string, color?: string, soft?: boolean, large?: boolean}) => {
  return (
    <Stack width={'100%'} direction={'row'} justifyContent={'space-between'} gap={2}>
      <Typography variant="body1" display={'flex'} alignItems={'center'}
        fontSize={props.large ? '1.25em' : '1em'}
        sx={{color: props.color || 'text.secondary'}}
      >
        {props.label} {props.labelInfo && <HelpIcon text={props.labelInfo}/>}
      </Typography>
      <Stack direction={'row'} gap={1}>
        {typeof props.value === 'string' && (
          <Typography variant="body1" fontWeight={props.soft ? 'normal' : 'bold'}
            fontSize={props.large ? '1.25em' : '1em'}
          >
            {props.value}
          </Typography>
        )}
        {typeof props.value !== 'string' && (
          <Typography variant="body1" fontSize={props.large ? '1.25em' : '1em'}>
            {props.value}
          </Typography>
        )}
        {props.suffix && <Typography variant="body1"
          fontSize={props.large ? '1.25em' : '1em'}
        >
          {props.suffix}
        </Typography>}
      </Stack>
    </Stack>
  )
}


const PoolsDetails = ({agent}: {agent: any}) => {
  const [show, setShow] = React.useState(false)

  return (
    <Box overflow={'visible'} position={'relative'} display={'flex'} alignItems={'center'}>
      <MoreHoriz onClick={() => setShow(!show)} 
        sx={[
          {cursor: 'pointer'}, 
          theme => ({
            '&:hover' : {
              backgroundColor: theme.palette.action.hover
            }
          })
        ]}/>
      {show && (
        <Box position={'absolute'} width={'400px'} maxHeight={'300px'} top={'100%'} right={'100%'}
          sx={{backgroundColor: 'var(--mui-palette-background-default)'}} boxShadow={4} p={2}
          display={'flex'} flexDirection={'column'} justifyContent={'flex-start'} alignItems={'stretch'} gap={1}>
          <Close sx={{position: 'absolute', right: '1rem', top: '1rem', cursor: 'pointer'}} 
            onClick={() => setShow(false)}
          />
          <Stack direction={'row'} gap={1} mb={2}>
            <Typography fontWeight={'bold'}>
              {`${agent.quoteTokenTicker} / ${agent.baseTokenTicker}`}
            </Typography>
            <Typography color={'text.secondary'}>
              using pools from
            </Typography>
          </Stack>
          <InfoLine
            label={`${agent.dex}`} 
            value={
              <Link href={`https://www.ao.link/entity/${agent.pool}`} target="_blank"
                variant="body1" fontFamily={'Courier New'}
                color={'text.primary'}
                sx={(theme) => ({
                  overflowWrap: 'anywhere',
                  display: 'inline-flex', 
                  alignItems: 'center', gap: 1, 
                  color: theme.palette.info.main
                  })}
                >
                {truncateId(agent.pool)}
                <LinkIcon/>
              </Link>
            }
          />
        </Box>
      )}
    </Box>
    
  )
}