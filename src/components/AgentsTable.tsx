'use client'

import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useRouter } from 'next/navigation';
import { useMyAgents } from '@/hooks/useMyAgents';
import LoadingEmptyState from './LoadingEmptyState';
import { Box, Typography } from '@mui/material';
import { enhanceRegisteredAgentInfo } from '@/utils/agent-utils';
import AgentStatusChip from './AgentStatusChip';
import { credSymbol, displayableCurrency } from '@/utils/data-utils';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.15s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));


export default function AgentsTable() {

  const router = useRouter()

  const agents = useMyAgents()

  const {loading, agentInfos} = agents

  const navigateToAgentPanel = (id: string) => {
    router.push('/single-agent?id=' + id)
  }

  if (agentInfos) {
    agentInfos.forEach((agentInfo) => {
      enhanceRegisteredAgentInfo(agentInfo)
    })
  }

  const sortedAgentInfos = agentInfos?.slice()
  sortedAgentInfos?.reverse()

  return (
    <>
      {loading && (
        <Box margin={'1rem auto 0'}>
          <LoadingEmptyState texts={['Retrieving your agents']}/>
        </Box>
      )}
      {!loading && !agentInfos && (
        <Box margin={'1rem auto 0'}>
          <Typography variant="h5" align="center" gutterBottom>
            Could not retrieve agents.
          </Typography>
        </Box>
      )}
      {!loading && agentInfos && !agentInfos.length && (
        <Box margin={'1rem auto 0'}>
          <Typography mt={'8rem'} variant="h5" align="center" gutterBottom>
            No Agents Found.
          </Typography>
        </Box>
      )}
      {!loading && !!agentInfos && !!agentInfos.length && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 900 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Agent Name</StyledTableCell>
                <StyledTableCell>Agent ID</StyledTableCell>
                <StyledTableCell align="right">Quote Balance</StyledTableCell>
                <StyledTableCell align="right">Owned Since</StyledTableCell>
                <StyledTableCell align="right">Status</StyledTableCell>
                <StyledTableCell align="right">Provenance</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAgentInfos?.map((agentInfo) => (
                <StyledTableRow key={agentInfo.Agent} 
                  onClick={() => navigateToAgentPanel(agentInfo.Agent)}
                  sx={{cursor: 'pointer'}}
                  >
                  <StyledTableCell component="th" scope="row">
                    {agentInfo.AgentName}
                  </StyledTableCell>
                  <StyledTableCell component="th" scope="row">
                    {agentInfo.Agent}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography component='span'>
                      <Typography component='span' fontWeight={'medium'} color="text.primary">{displayableCurrency(agentInfo.QuoteTokenBalance)}</Typography>
                      <Typography component='span' variant="body1" color="text.secondary">{" "}{credSymbol}</Typography>
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right">{agentInfo.ownedSince}</StyledTableCell>
                  <StyledTableCell align="right">
                    {agentInfo.statusX ? <AgentStatusChip statusX={agentInfo.statusX} noIcon/> : '- -'}
                  </StyledTableCell>
                  <StyledTableCell align="right">{agentInfo.provenance}</StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}