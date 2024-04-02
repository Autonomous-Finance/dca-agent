"use client"

import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import React from "react"

import { Receipt, launch } from "@/api/dca-bot"
import { credSymbol } from "@/api/testnet-cred"
import Image from "next/image"
import { TYPE_ICON_MAP } from "@/utils/data-utils"


const TARGET_CURRENCIES = ["BARK"] as const
export type TargetToken = typeof TARGET_CURRENCIES[number]

const INTERVAL_TYPE = ["Minutes", "Hours", "Days"] as const
export type IntervalType = typeof INTERVAL_TYPE[number]

export function LaunchBot() {
  const [receipt, setReceipt] = React.useState<Receipt | null>(null)
  const [loading, setLoading] = React.useState(false)

  const [amount, setAmount] = React.useState("")
  const [slippage, setSlippage] = React.useState("")
  const [currency, setCurrency] = React.useState<TargetToken>("BARK")
  const [intervalType, setIntervalType] = React.useState<IntervalType>("Days")
  const [intervalValue, setIntervalValue] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 10_000) {
      setError("Amount must be a number greater than or equal to 10,000")
      return
    }
    console.log("Submitting", amount)

    setError("")
    setLoading(true)
    setReceipt(null)
    launch(parsed)
      .then(setReceipt)
      .then(() => {
        setAmount("")
      })
      .finally(() => setLoading(false))
      .catch((err) => {
        console.error(err)
      })
  }

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Stack gap={4} alignItems="stretch">
        <Typography variant="h6">Create New Bot</Typography>

        <Stack direction="row" gap={2} alignItems="stretch">
          <Stack direction="column" sx={{minWidth: 300}} gap={3} alignItems="flex-start">
            <FormControl fullWidth>
              <InputLabel id="target-currency-label">Target Currency</InputLabel>
              <Select
                labelId="target-currency-label"
                id="target-currency"
                value={currency}
                label="Target Currency"
                onChange={(e) => setCurrency(e.target.value as TargetToken)}
              >
                {TARGET_CURRENCIES.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" gap={1} sx={{width: "100%"}}>
              <FormControl fullWidth>
                <TextField
                  disabled={loading}
                  size="small"
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  type="number"
                  label="Interval"
                  error={error !== ""}
                  helperText={error}
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="interval-type-label"></InputLabel>
                <Select
                  size="small"
                  labelId="interval-type-label"
                  id="interval-type"
                  value={intervalType}
                  label=""
                  onChange={(e) => setIntervalType(e.target.value as IntervalType)}
                >
                  {INTERVAL_TYPE.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              disabled={loading}
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              label="Swap Amount"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{credSymbol}</InputAdornment>
                ),
              }}
              error={error !== ""}
              helperText={error}
            />
            <TextField
              disabled={loading}
              size="small"
              sx={{ width: "100%" }}
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              type="number"
              label="Max Slippage"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">%</InputAdornment>
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
              onClick={handleSubmit}
            >
              Deploy
            </Button>
          </Stack>
          <Box
            sx={{flexGrow: 1, opacity: 0.15}}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Image alt="icon" width={150} height={150} src={TYPE_ICON_MAP["Process"]}/>
          </Box>
        </Stack>


        {receipt !== null && !loading && (
          <>
            {receipt.type === "Success" ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--mui-palette-success-main)" }}
                >
                  Successfully deployed DCA bot.
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--mui-palette-error-main)" }}
                >
                  Failed to send transaction. Please try again.
                </Typography>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  )
}
