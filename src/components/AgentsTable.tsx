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

function createData(
  id: string,
  createdAt: number,
  status: string
) {
  return { id, createdAt, status };
}

const rows = [
  createData('Jic3UQSN19Sa5Wa4gPhBpJkucdWTqCczGsuIdo', 1712748611000, 'Retired'),
  createData('Kic3UQSN19Sa5Wa4gPhBpJkucdWTqCczGsuIdo', 1712718611000, 'Active'),
  createData('Lic3UQSN19Sa5Wa4gPhBpJkucdWTqCczGsuIdo', 1712508611000, 'No Funds')
];

export default function AgentsTable() {

  const router = useRouter()

  const agents = useMyAgents()
  console.log('AGENTS: ', agents)

  const navigateToAgentPanel = (id: string) => {
    router.push('/my-agents?id=' + id)
  }

  return (
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
          {rows.map((row) => (
            <StyledTableRow key={row.id} onClick={() => navigateToAgentPanel(row.id)}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell align="right">{(new Date(row.createdAt).toLocaleString())}</StyledTableCell>
              <StyledTableCell align="right">{row.status}</StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}