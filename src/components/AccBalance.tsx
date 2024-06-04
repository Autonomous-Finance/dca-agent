import { Box, CircularProgress, Paper, Skeleton, Stack, Typography } from "@mui/material"
import { useActiveAddress } from "arweave-wallet-kit"
import React from "react"

import { useAccountBalance } from "@/hooks/useAccountBalance"
import { Refresh } from "@mui/icons-material"

export function AccBalance() {
  const address = useActiveAddress()
  const {balance, loading, loadingTrigger, lastUpdate, triggerUpdate } = useAccountBalance();

  if (!address) return

  return (
    <Box>

      <Paper sx={{position: 'relative'}}>
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
            <Typography>{(balance) / 1000} AOCRED</Typography>
          )}
        </Stack>
      </Paper>
      <Paper
          sx={{
            position: 'absolute',
            bottom: 0,
            minWidth: '240px',
            transform: `translateY(calc(100% + 0.25rem))`,
            opacity: 0.4
          }}>
        <Stack
          sx={{
            paddingX: 2,
            paddingY: '0.125rem'
          }}
          direction={'row'}
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          {loading ? (
            <Skeleton width={120} />
          ) : (
            <>
              <Typography>
                {`Last updated ${lastUpdate.toLocaleTimeString()}`}
              </Typography>
              {loadingTrigger && <CircularProgress size={14} sx={{color: 'var(--mui-palette-success-main)'}}/>}
              
              {!loadingTrigger && <Refresh onClick={triggerUpdate}/>}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
