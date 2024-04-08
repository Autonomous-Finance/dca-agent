"use client"

import { Box, Divider, Paper, Stack, Typography } from "@mui/material"
import React from "react"

import { credSymbol } from "@/api/testnet-cred"
import { AgentStatusDisplay } from "./AgentStatusDisplay"
import { depositToAgent, retireAgent, transferOwnership, withdrawBase } from "@/utils/agent-utils"
import TransferOwnershipDialog from "@/components/TransferOwnershipDialog"
import Log, { LogEntry } from "@/components/Log"
import TopUpDialog from "@/components/TopUpDialog"
import WithdrawBaseDialog from "@/components/WithdrawBaseDialog"
import { useIdentifiedAgent } from "./hooks/useCheckAgent"
import { isLocalDev } from "@/utils/debug-utils"
import RetirementDialog from "@/components/RetirementDialog"

export function AgentPanel() {
  const [actionLog, setActionLog] = React.useState<LogEntry[]>([])
  
  const [loadingTopUp, setLoadingTopUp] = React.useState(false)
  const [loadingWithdrawBase, setLoadingWithdrawBase] = React.useState(false)
  const [loadingTransferOwnership, setLoadingTransferOwnership] = React.useState(false)
  const [loadingRetirement, setLoadingRetirement] = React.useState(false)

  const agent = useIdentifiedAgent()

  if (!agent) return <></>
  
  const {status} = agent

  const credBalance = status.baseTokenBalance || '-';

  const addToLog = (entry: LogEntry, error?: string) => {
    if (error && isLocalDev()) {
      entry.text = `${entry.text} - ${error}`
    }
    setActionLog((log) => [...log, entry])
  }

  const handleDeposit = async (amount: string) => {
    setLoadingTopUp(true)
    addToLog({text: `Depositing ${amount} ${credSymbol} to agent...`, hasLink: false})
    const depositResult = await depositToAgent(amount)
    setLoadingTopUp(false)
    if (depositResult?.type === "Success") {
      const msgId = depositResult.result
      addToLog({ text: 'Deposit successful. MessageID', hasLink: true, linkId: msgId, isMessage: true})
    } else {
      addToLog({text: `Failed to deposit ${credSymbol}. Please try again.`, hasLink: false, isError: true}, depositResult.result)
    }
  }

  const handleWithdrawBase = async (amount: string) => {
    setLoadingWithdrawBase(true)
    addToLog({ text: `Withdrawing ${amount} ${credSymbol} from agent...`, hasLink: false})
    const withdrawResult = await withdrawBase(amount)
    setLoadingWithdrawBase(false)
    if (withdrawResult?.type === "Success") {
      const msgId = withdrawResult.result
      addToLog({ text: 'Withdrawal successful. MessageID', linkId: msgId, isMessage: true, hasLink: true})
    } else {
      addToLog({ text: `Failed to withdraw ${credSymbol}. Please try again.`, isError: true, hasLink: false}, withdrawResult.result)
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
    addToLog({text: `Transferring ownership to ${id}...`, hasLink: false})
    setLoadingTransferOwnership(false)
    const transferResult = await transferOwnership(id)
    if (transferResult.type === "Success") {
      const msgId = transferResult.result
      addToLog({text: `Ownership transferred to ${id}. MessageID`, linkId: msgId, isMessage: false, hasLink: true})
    } else {
      addToLog({text: `Failed to transfer ownership to ${id}. Please try again.`, hasLink: false, isError: true}, transferResult.result)
    }
  }

  const handleRetirement = async () => {
    setLoadingRetirement(true)
    addToLog({text: `Retiring agent...`, hasLink: false})
    setLoadingRetirement(false)
    const retirementResult = await retireAgent()
    if (retirementResult.type === "Success") {
      const msgId = retirementResult.result
      addToLog({text: `Agent retired. MessageID`, linkId: msgId, isMessage: false, hasLink: true})
    } else {
      addToLog({text: `Failed to retire agent. Please make sure it has zero balances and retry.`, hasLink: false, isError: true}, retirementResult.result)
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
            <AgentStatusDisplay />
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
                    tokenSymbol={credSymbol}
                    withdraw={handleWithdrawBase}/>
                </Stack>
              </Stack>
            </Stack>
            <Divider/>
            <Stack gap={2} mt={'auto'}>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Ownership
                  </Typography>
                  <Typography variant="body2">
                    You own this agent
                  </Typography>
                </Stack>
                <TransferOwnershipDialog loading={loadingTransferOwnership} btnWidth={BTN_WIDTH} transferTo={handleTransferOwnership}/>
              </Stack>
              <Divider/>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Retirement
                  </Typography>
                </Stack>
                <RetirementDialog loading={loadingTransferOwnership} btnWidth={BTN_WIDTH} retire={handleRetirement}/>
              </Stack>
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
