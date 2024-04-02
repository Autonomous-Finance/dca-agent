"use client"

import { Pause, PlayArrow } from "@mui/icons-material"
import { Button, Chip, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material"
import React from "react"

import { credSymbol } from "@/api/testnet-cred"
import { readBotStatus, topUp } from "@/api/dca-bot"
import type { BotStatus, Receipt } from "@/api/dca-bot"
import { BotStatusDisplay } from "./BotStatusDisplay"


export function ActiveBot(props: { initialBotStatus: BotStatus }) {
  const [receipt, setReceipt] = React.useState<Receipt | null>(null)
  const [loading, setLoading] = React.useState(false)

  const [amount, setAmount] = React.useState("")
  const [error, setError] = React.useState("")

  const handleDeposit = () => {
      const parsed = parseFloat(amount)
      if (isNaN(parsed) || parsed < 10_000) {
        setError("Amount must be a number greater than or equal to 10,000")
        return
      }
      console.log("Submitting", amount)

      setError("")
      setLoading(true)
      setReceipt(null)
      topUp(parsed)
        .then(setReceipt)
        .then(() => {
          setAmount("")
        })
        .finally(() => setLoading(false))
        .catch((err) => {
          console.error(err)
        })
    }

  const handleWithdrawBase = () => {
    console.log("Withdrawing Base");

    // TODO
  }

  const handleWithdrawTarget = () => {
    console.log("Withdrawing Target");

    // TODO
  }

  const handleLiquidate = () => {
    console.log("Liquidating");

    // TODO
  }

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Stack gap={2} alignItems="flex-start">
        <BotStatusDisplay initialBotStatus={props.initialBotStatus} />
        <Stack direction="row" gap={2} alignItems="flex-start" 
          justifyContent="space-between" sx={{width: '100%'}}>
          <Stack direction="column" sx={{minWidth: 300}} gap={3} alignItems="flex-start">
              
              <TextField
                disabled={loading}
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                label="Desposit Amount"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">{credSymbol}</InputAdornment>
                  ),
                }}
                error={error !== ""}
                helperText={error}
              />

              <Button
                sx={{ height: 40, width: '100%' }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} /> : undefined}
                variant="contained"
                onClick={handleDeposit}
              >
                Deposit
              </Button>
          </Stack>
          <Stack direction="column" gap={3} alignItems="flex-start">
            <Button
              sx={{ height: 40, width: '100%' }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} /> : undefined}
              variant="contained"
              onClick={handleWithdrawBase}
            >
              Withdraw Base
            </Button>

            <Button
              sx={{ height: 40, width: '100%' }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} /> : undefined}
              variant="contained"
              onClick={handleWithdrawTarget}
            >
              Withdraw Target
            </Button>
            
            <Button
              sx={{ height: 40, width: '100%' }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} /> : undefined}
              variant="contained"
              onClick={handleLiquidate}
            >
              Liquidate
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}
