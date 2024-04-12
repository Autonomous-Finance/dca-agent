'use client'

import { Button, Divider, Stack } from "@mui/material";
import Link from "next/link";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AgentsTable from "@/components/AgentsTable";

export default function MyAgents() {

  return (
    <Stack mt={2} gap={2} mx={'auto'} px={'16px'}> 
      <Button component={Link} href="/create-agent"
        variant="outlined"
        color="success"
        sx={{ fontSize: '1.25rem', marginLeft: 'auto' }}>
        Create Agent <AddCircleOutlineIcon sx={{marginLeft: '0.5rem'}}/>
      </Button>

      <Divider />

      <AgentsTable/>
    </Stack>
  )
}