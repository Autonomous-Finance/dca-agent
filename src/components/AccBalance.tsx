import { Paper, Skeleton, Stack, Typography } from "@mui/material"
import { useActiveAddress } from "arweave-wallet-kit"
import React from "react"

import { useAccountBalance } from "@/hooks/useAccountBalance"

export function AccBalance() {
  const address = useActiveAddress()
  const {balance, loading} = useAccountBalance();

  if (!address) return

  return (
    <Paper>
      <Stack
        sx={{
          height: 52,
          paddingX: 2,
        }}
        alignItems="center"
        justifyContent="center"
      >
        {loading ? (
          <Skeleton width={120} />
        ) : (
          <Typography>{balance} AOCRED-Test</Typography>
        )}
      </Stack>
    </Paper>
  )
}
