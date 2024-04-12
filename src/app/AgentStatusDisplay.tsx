"use client"

import { Box, Divider, Link, Stack, Typography } from "@mui/material"
import React, { ReactNode } from "react"
import { enhanceAgentStatus} from "@/utils/agent-utils";
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider";
import { shortenId } from "@/utils/ao-utils";
import LinkIcon from '@mui/icons-material/Link';
import AgentStatusChip from "@/components/AgentStatusChip";
import HelpIcon from "@/components/HelpIcon";
import { ArrowForward, ArrowRight, ArrowRightAlt, East } from "@mui/icons-material";


const HELP_TEXT_SPR = 'Strategy Performance Ratio (SPR) reflects the performance of the agent. Calculated as the inverse ratio between the hypothetical costs of buying the same amount of base tokens right now and the effective historical costs of buying them via DCA.'
const HELP_TEXT_TOTAL_DEPOSITED = 'Total amount of quote tokens deposited to the agent.'

export function AgentStatusDisplay() {

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  enhanceAgentStatus(status)

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
          {/* CONFIG */}
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

          <Typography mx='auto' display={'flex'} sx={{opacity: 0}}>
            -
          </Typography>
          <Typography display={'flex'} fontWeight={'bold'}>
            DCA CONFIGURATION
          </Typography>
          <InfoLine label='Currencies' value={
            <Typography display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1} width={'100%'} fontWeight={'medium'}>
              {status.quoteTokenSymbol} <East /> {status.baseTokenSymbol}
            </Typography>}/>
          <InfoLine label={'Swap Frequency'} value={`${status.swapIntervalValue} ${status.swapIntervalUnit}`}></InfoLine>
          <InfoLine label={'Swap Amount'} value={`${status.swapInAmount}`} suffix={status.quoteTokenSymbol}></InfoLine>
        </Stack>
        <Box px={2}>
          <Divider orientation="vertical"/>
        </Box>
        <Stack flex={'grow'} width={'100%'} gap={2}>
          {/* CURRENT VALUES */}
          <InfoLine label={'Base Balance'} value={`${status.baseTokenBalance}`} suffix={status.baseTokenSymbol}
            />
          <InfoLine label={'Quote Balance'} value={`${status.quoteTokenBalance}`} suffix={status.quoteTokenSymbol}
            color={status.statusX === 'No Funds' ? 'var(--mui-palette-warning-main)' : ''}/>
          <Box my={'12px'}><Divider /></Box>
          {/* TODO calculate real value est. based on base token price */}
          <InfoLine label={'Total Deposited'} value={`n/A`} suffix={status.quoteTokenSymbol}/>
          <InfoLine label={'Total Swaps'} value={`n/A`} />
          <InfoLine label={'Total Value (est.)'} value={`n/A`} suffix={status.quoteTokenSymbol}/>
          <InfoLine label={'SPR'} value={`n/A`} suffix={'%'} labelInfo={HELP_TEXT_SPR}/>
        </Stack>
      </Stack>
    </Stack>
  )
}

const InfoLine = (props: {label: string, value: ReactNode, suffix?: string, labelInfo?: string, color?: string}) => {
  return (
    <Stack direction={'row'} justifyContent={'space-between'} gap={2}>
      <Typography variant="body1" display={'flex'} alignItems={'center'}
        sx={{color: props.color || 'text.secondary'}}
      >
        {props.label} {props.labelInfo && <HelpIcon text={props.labelInfo}/>}
      </Typography>
      <Stack direction={'row'} gap={1}>
        {typeof props.value === 'string' && (
          <Typography variant="body1" fontWeight={'bold'}>
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
