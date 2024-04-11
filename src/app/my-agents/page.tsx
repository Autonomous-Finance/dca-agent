'use client'

import { Button, Divider, Stack } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AgentsTable from "@/components/AgentsTable";

export default function MyAgents() {
  const router = useRouter()

  const navigateBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.back()
  }

  return (
    <Stack mt={4} gap={4} mx={'auto'} px={'16px'}> 
      <Button component={Link} href="/create-agent"
        size="large"
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