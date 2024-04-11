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
import { Chip, Typography } from '@mui/material';
import { RegisteredAgent } from '@/hooks/useLatestRegisteredAgent';
import { credSymbol } from '@/utils/agent-utils';

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


const StatusChip = ({agentInfo}: {agentInfo: RegisteredAgent}) => {
  return (
    <>  
      {agentInfo.status === 'Active' && (
        <Chip label="Active" variant="outlined" color="success" 
          sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}}
        />
      )}
      {agentInfo.status === 'Retired' && (
        <Chip label="Retired" variant="outlined" color="primary" 
            sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}} 
        />
      )}
      {agentInfo.status === 'No Funds' && (
        <Chip label="No Funds" variant="outlined" color="warning" 
            sx={{padding: '0.5rem', fontSize: '1rem', fontWeight: 'bold'}}  
        />
      )}
    </>
  )
}


export default function AgentsTable() {

  const router = useRouter()

  const agents = useMyAgents()

  const {loading, agentInfos, refresh} = agents

  const navigateToAgentPanel = (id: string) => {
    router.push('/my-agents?id=' + id)
  }

  if (agentInfos) {
    agentInfos.forEach((agentInfo) => {
      if (agentInfo.Retired) {
        agentInfo.status = 'Retired'
      } else if (agentInfo.QuoteTokenBalance === '0') { // TODO update to compare to price of automated swap
        agentInfo.status = 'No Funds'
      } else {
        agentInfo.status = 'Active'
      }

      agentInfo.ownedSince = (new Date(agentInfo.TransferredAt ?? agentInfo.CreatedAt).toLocaleString())
      agentInfo.provenance = agentInfo.TransferredAt ? 'Transfer' : 'Created'
    })
  }

  const sortedAgentInfos = agentInfos?.slice()
  sortedAgentInfos?.reverse()

  return (
    <>
      {loading && (
        <LoadingEmptyState texts={['Retrieving your agents']}/>
      )}
      {!loading && !agentInfos && (
        <Typography variant="h5" align="center" gutterBottom>
          Could not retrieve agents.
        </Typography>
      )}
      {!loading && agentInfos && !agentInfos.length && (
        <Typography variant="h5" align="center" gutterBottom>
          No Agents Found.
        </Typography>
      )}
      {!loading && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 900 }} aria-label="customized table">
            <TableHead>
              <TableRow>
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
                    {agentInfo.Agent}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography component='span'>
                      <Typography component='span' fontWeight={'bold'} color="text.primary">{agentInfo.QuoteTokenBalance}</Typography>
                      <Typography component='span' variant="body1" color="text.secondary">{" "}{credSymbol}</Typography>
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell align="right">{agentInfo.ownedSince}</StyledTableCell>
                  <StyledTableCell align="right">
                    <StatusChip agentInfo={agentInfo}/>
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