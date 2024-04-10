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
import { Typography } from '@mui/material';

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
  '&:nth-of-type(odd)': {
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

  const {loading, agentInfos, refresh} = agents

  const navigateToAgentPanel = (id: string) => {
    router.push('/my-agents?id=' + id)
  }

  if (agentInfos) {
    agentInfos.forEach((agentInfo) => {
      agentInfo.status = agentInfo.Retired ? 'Retired' : 'Active' // TODO add 'no funds' to status -> registry will have to keep track of quote token balance and configured swap amount
    })
  }

  const GreenPoint = styled('span')(({ theme }) => ({
    color: theme.palette.success.main,
    fontWeight: 'bold',
  }));

  const OrangePoint = styled('span')(({ theme }) => ({
    color: theme.palette.warning.main,
    fontWeight: 'bold',
  }));

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
                <StyledTableCell align="right">Created</StyledTableCell>
                <StyledTableCell align="right">Status</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agentInfos?.map((agentInfo) => (
                <StyledTableRow key={agentInfo.Agent} 
                  onClick={() => navigateToAgentPanel(agentInfo.Agent)}
                  sx={{cursor: 'pointer'}}
                  >
                  <StyledTableCell component="th" scope="row">
                    {agentInfo.Agent}
                  </StyledTableCell>
                  <StyledTableCell align="right">{(new Date(agentInfo.CreatedAt).toLocaleString())}</StyledTableCell>
                  <StyledTableCell align="right">
                    <Typography color={agentInfo.status === 'Active' ? 'green' : 'primary'}
                      fontSize={'large'}
                      fontWeight={agentInfo.status === 'Active' ? 'bold' : 'normal'}
                      >
                      {agentInfo.status}
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}