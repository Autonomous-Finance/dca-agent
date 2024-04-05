"use client"

import { Button, CircularProgress, Divider, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material"
import React from "react"

import { credSymbol } from "@/api/testnet-cred"
import { topUp } from "@/api/dca-bot"
import type {  Receipt } from "@/api/dca-bot"
import { BotStatusDisplay } from "./BotStatusDisplay"
import { BotStatus } from "@/utils/bot-utils"
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';


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

    const handleSubmit = () => {
      // VALIDATE INPUTS
  
      // const parsed = parseFloat(amount)
      // if (isNaN(parsed) || parsed < 10_000) {
      //   setError("Amount must be a number greater than or equal to 10,000")
      //   return
      // }
      // console.log("Submitting", amount)
  
      // setError("")
      // setLoading(true)
      // setReceipt(null)
      // launch(parsed)
      //   .then(setReceipt)
      //   .then(() => {
      //     setAmount("")
      //   })
      //   .finally(() => setLoading(false))
      //   .catch((err) => {
      //     console.error(err)
      //   })
    }

  const testInteract = async () => {
      // const MATCHER = "sv19re5wxgxf0yHRezHh0shuP-UkRRO8qKP2R50XGs4"
      // const testOwner = await message({
      //   process: MATCHER,
      //   tags: [{ name: "Action", value: "ShowOwner" }],
      //   signer: createDataItemSigner(window.arweaveWallet),
      // })
      // console.log("Message sent: ", testOwner)
      // const res = await result({
      //   // the arweave TXID of the message
      //   message: testOwner,
      //   // the arweave TXID of the process
      //   process: MATCHER,
      // })

      // console.log("OWNER: ", res)
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

  const BTN_WIDTH = 150
  return (
    <Paper variant="outlined" sx={{ padding: 4 }}>
      <Stack gap={4}>
        <BotStatusDisplay initialBotStatus={props.initialBotStatus} />
        <Divider />
        <Stack direction="row" justifyContent={'space-between'}>
          <Typography variant="h6">
            AOCRED-Test
          </Typography>
          <Button
            sx={{ height: 40, width: BTN_WIDTH }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} /> : undefined}
            variant="contained"
            onClick={handleDeposit}
          >
            Top Up <AddIcon sx={{marginLeft: '0.25rem'}}/>
          </Button>
          <Button
            sx={{ height: 40, width: BTN_WIDTH }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} /> : undefined}
            variant="contained"
            onClick={handleWithdrawBase}
          >
            Withdraw <RemoveIcon sx={{marginLeft: '0.25rem'}}/>
          </Button>
        </Stack>
        {/* <Stack direction="row" justifyContent={'space-between'}>
          <Typography variant="h6">
            AOCRED-Test
          </Typography>

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
         </Stack> */}

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
