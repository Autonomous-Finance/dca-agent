import { Paper, Skeleton, Stack, Typography } from "@mui/material"
import { useActiveAddress } from "arweave-wallet-kit"
import React from "react"

import { readBalance } from "@/api/testnet-cred"

export function AccBalance() {
  const address = useActiveAddress()
  const [balance, setBalance] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!address) return
    setLoading(true)
    readBalance(address)
      .then(setBalance)
      .finally(() => setLoading(false))
  }, [address])

  React.useEffect(() => {
    if (!address) return
    const interval = setInterval(() => {
      readBalance(address).then(setBalance)
    }, 1000)

    return () => clearInterval(interval)
  }, [address])

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
