"use client"

import { Box, Divider, Paper, Stack, Typography } from "@mui/material"
import React from "react"

import { credSymbol } from "@/api/testnet-cred"
import { BotStatusDisplay } from "./BotStatusDisplay"
import { BotStatus, depositToBot, transferOwnership, withdrawBase } from "@/utils/bot-utils"
import TransferOwnershipDialog from "@/components/TransferOwnershipDialog"
import Log, { LogEntry } from "@/components/Log"
import TopUpDialog from "@/components/TopUpDialog"
import WithdrawBaseDialog from "@/components/WithdrawBaseDialog"
import { useIdentifiedBot } from "./hooks/useCheckBot"

export function BotPanel() {
  const [actionLog, setActionLog] = React.useState<LogEntry[]>([])
  
  const [loadingTopUp, setLoadingTopUp] = React.useState(false)
  const [loadingWithdrawBase, setLoadingWithdrawBase] = React.useState(false)
  const [loadingTransferOwnership, setLoadingTransferOwnership] = React.useState(false)

  const bot = useIdentifiedBot()

  if (!bot) return <></>
  
  const {status} = bot

  const credBalance = status.baseTokenBalance || '-';

  const addToLog = (entry: LogEntry) => setActionLog((log) => [...log, entry]);

  const handleDeposit = async (amount: string) => {
    setLoadingTopUp(true)
    addToLog(`Depositing ${amount} ${credSymbol} to bot`)
    const msgId = await depositToBot(amount)
    setLoadingTopUp(false)
    if (msgId) {
      addToLog({ text: 'Deposit successful. MessageID', linkId: msgId})
    } else {
      // TODO make this more nuanced, depending on what went wrong
      addToLog(`Failed to deposit ${credSymbol}. Please try again.`)
    }
  }

  const handleWithdrawBase = async (amount: string) => {
    setLoadingWithdrawBase(true)
    addToLog(`Withdrawing ${amount} ${credSymbol} from bot`)
    const msgId = await withdrawBase(amount)
    setLoadingWithdrawBase(false)
    if (msgId) {
      addToLog({ text: 'Withdrawal successful. MessageID', linkId: msgId})
    } else {
      // TODO make this more nuanced, depending on what went wrong
      addToLog(`Failed to withdraw ${credSymbol}. Please try again.`)
    }
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

  const handleTransferOwnership = async (id: string) => {
    setLoadingTransferOwnership(true)
    addToLog(`Transferring ownership to ${id}`)
    const msgId = await transferOwnership(id)
    setLoadingTransferOwnership(false)
    if (msgId) {
      addToLog({text: `Ownership transferred to ${id}. MessageID`, linkId: msgId})
    } else {
      // TODO make this more nuanced, depending on what went wrong
      addToLog(`Failed to transfer ownership to ${id}. Please try again.`)
    }
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
    <Box maxWidth={'min-content'} mx={'auto'}>
      <Paper variant="outlined" sx={{ padding: 4 }}>
        <Stack direction={'row'} gap={4} height={600}>
          <Stack gap={4} width={540}>
            <BotStatusDisplay />
            <Divider />
            <Stack>
              <Typography variant="h6">
                Base Token
              </Typography>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Box flexGrow={1} display={'flex'} justifyContent={'space-between'}>
                  <Typography component='span' fontSize={'large'} fontWeight={'bold'} color="text.primary">{credBalance}</Typography>
                  <Typography component='span' fontSize={'large'} color="text.secondary">{credSymbol}</Typography>
                </Box>
                <Stack direction="row" gap={2} alignItems={'center'}>
                  <TopUpDialog loading={loadingTopUp} btnWidth={BTN_WIDTH} 
                    tokenSymbol={credSymbol} tokenBalance={credBalance}
                    topUp={handleDeposit}/>
                  <WithdrawBaseDialog loading={loadingWithdrawBase} btnWidth={BTN_WIDTH}
                    tokenSymbol={credSymbol} tokenBalance={credBalance}
                    withdraw={handleWithdrawBase}/>
                </Stack>
              </Stack>
            </Stack>
            <Divider/>
            <Stack direction="row" mt={'auto'} justifyContent={'space-between'} alignItems={'center'}>
              <Stack>
                <Typography variant="h6">
                  Ownership
                </Typography>
                <Typography variant="body2">
                  You own this bot
                </Typography>
              </Stack>
              <TransferOwnershipDialog loading={loadingTransferOwnership} btnWidth={BTN_WIDTH} transferTo={handleTransferOwnership}/>
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
            
            
          </Stack>
          {actionLog.length > 0 && (
            <Stack flexGrow={1} pl={4} gap={1} height={'100%'} width={400}
              borderLeft={'1px solid var(--mui-palette-divider)'}
              >
              <Typography variant="h6">
                Action Log
              </Typography>
              <Log log={actionLog}/>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
