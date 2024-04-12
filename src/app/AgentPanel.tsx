"use client"

import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material"
import React from "react"

import { AgentStatusDisplay } from "./AgentStatusDisplay"
import { credSymbol, depositToAgent, liquidate, retireAgent, transferOwnership, withdrawBase, withdrawQuote } from "@/utils/agent-utils"
import TransferOwnershipDialog from "@/components/TransferOwnershipDialog"
import Log, { LogEntry } from "@/components/Log"
import TopUpDialog from "@/components/TopUpDialog"
import WithdrawDialog from "@/components/WithdrawDialog"
import { isLocalDev } from "@/utils/debug-utils"
import RetirementDialog from "@/components/RetirementDialog"
import AgentInfoUnit from "@/components/AgentInfoUnit"
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider"
import { WaterDrop } from "@mui/icons-material"
import LiquidateDialog from "@/components/LiquidateDialog"

export function AgentPanel() {
  const [actionLog, setActionLog] = React.useState<LogEntry[]>([])
  
  const [loadingTopUp, setLoadingTopUp] = React.useState(false)
  const [loadingWithdrawQuote, setLoadingWithdrawQuote] = React.useState(false)
  const [loadingWithdrawBase, setLoadingWithdrawBase] = React.useState(false)
  const [loadingLiquidate, setLoadingLiquidate] = React.useState(false)
  const [loadingTransferOwnership, setLoadingTransferOwnership] = React.useState(false)
  const [loadingRetirement, setLoadingRetirement] = React.useState(false)

  const [showOwnership, setShowOwnership] = React.useState(true)
  const [disabledActions, setDisabledActions] = React.useState(false)

  const agent = usePolledAgentStatusContext();

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const addToLog = (entry: LogEntry, error?: string) => {
    if (error && isLocalDev()) {
      entry.text = `${entry.text} - ${error}`
    }
    setActionLog((log) => [...log, entry])
  }

  const handleDeposit = async (amount: string) => {
    setLoadingTopUp(true)
    addToLog({text: `Depositing ${amount} ${credSymbol} to agent...`, hasLink: false})
    const depositResult = await depositToAgent(agent.agentId, amount)
    setLoadingTopUp(false)
    if (depositResult?.type === "Success") {
      const msgId = depositResult.result
      addToLog({ text: 'Deposit successful. MessageID', hasLink: true, linkId: msgId, isMessage: true})
    } else {
      addToLog({text: `Failed to deposit ${credSymbol}. Please try again.`, hasLink: false, isError: true}, depositResult.result)
    }
  }

  const handleWithdrawQuote = async (amount: string) => {
    setLoadingWithdrawQuote(true)
    addToLog({ text: `Withdrawing ${amount} ${credSymbol} from agent...`, hasLink: false})
    const withdrawResult = await withdrawQuote(agent.agentId, amount)
    setLoadingWithdrawQuote(false)
    if (withdrawResult?.type === "Success") {
      const msgId = withdrawResult.result
      addToLog({ text: 'Withdrawal successful. MessageID', linkId: msgId, isMessage: true, hasLink: true})
    } else {
      addToLog({ text: `Failed to withdraw ${credSymbol}. Please try again.`, isError: true, hasLink: false}, withdrawResult.result)
    }
  }

  const handleWithdrawBase = async (amount: string) => {
    // TODO
    setLoadingWithdrawBase(true)
    addToLog({ text: `Withdrawing ${amount} ${status.baseTokenSymbol} from agent...`, hasLink: false})
    const withdrawResult = await withdrawBase(agent.agentId, amount)
    setLoadingWithdrawBase(false)
    if (withdrawResult?.type === "Success") {
      const msgId = withdrawResult.result
      addToLog({ text: 'Withdrawal successful. MessageID', linkId: msgId, isMessage: true, hasLink: true})
    } else {
      addToLog({ text: `Failed to withdraw ${status.baseTokenSymbol}. Please try again.`, isError: true, hasLink: false}, withdrawResult.result)
    }
  }

  const handleLiquidate = async () => {
    // TODO 
    setLoadingLiquidate(true)
    addToLog({ text: `Liquidating agent. Selling base token and withdrawing...`, hasLink: false})
    const liquidationResult = await liquidate(agent.agentId)
    setLoadingLiquidate(false)
    if (liquidationResult?.type === "Success") {
      const msgId = liquidationResult.result
      addToLog({ text: 'Liquidation successful. MessageID', linkId: msgId, isMessage: true, hasLink: true})
    } else {
      addToLog({ text: `Failed to liquidate. Please try again.`, isError: true, hasLink: false}, liquidationResult.result)
    }
  }

  const handleTransferOwnership = async (id: string) => {
    setLoadingTransferOwnership(true)
    addToLog({text: `Transferring ownership to ${id}...`, hasLink: false})
    setLoadingTransferOwnership(false)
    const transferResult = await transferOwnership(agent.agentId, id)
    if (transferResult.type === "Success") {
      const msgId = transferResult.result
      addToLog({text: `Ownership transferred to ${id}. MessageID`, linkId: msgId, isMessage: false, hasLink: true})
      setDisabledActions(true)
      setShowOwnership(false)
    } else {
      addToLog({text: `Failed to transfer ownership to ${id}. Please try again.`, hasLink: false, isError: true}, transferResult.result)
    }
  }

  const handleRetirement = async () => {
    setLoadingRetirement(true)
    addToLog({text: `Retiring agent...`, hasLink: false})
    setLoadingRetirement(false)
    const retirementResult = await retireAgent(agent.agentId)
    if (retirementResult.type === "Success") {
      const msgId = retirementResult.result
      addToLog({text: `Agent retired. MessageID`, linkId: msgId, isMessage: false, hasLink: true})
      setDisabledActions(true)
    } else {
      addToLog({text: `Failed to retire agent. Please make sure it has zero balances and retry.`, hasLink: false, isError: true}, retirementResult.result)
    }
  }

  const BTN_WIDTH = 150

  return (
    <Box maxWidth={'min-content'} mx={'auto'}>
      <Paper variant="outlined" sx={{ padding: 4 }}>
        <Stack direction={'row'} gap={4} minHeight={600} maxHeight={800} overflow={'auto'}>
          <Stack gap={4} width={664}>
            <AgentStatusDisplay/>
            <Divider />

            <Stack gap={2}>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                  {status.quoteTokenSymbol}
                </Typography>
                <Stack direction="row" gap={2} alignItems={'center'}>
                  <TopUpDialog disabled={disabledActions} loading={loadingTopUp} btnWidth={BTN_WIDTH} 
                    tokenSymbol={status.quoteTokenSymbol!} tokenBalance={status.quoteTokenBalance}
                    topUp={handleDeposit}/>
                  <WithdrawDialog type="quote" disabled={disabledActions} loading={loadingWithdrawQuote} btnWidth={BTN_WIDTH}
                    tokenSymbol={status.quoteTokenSymbol!}
                    withdraw={handleWithdrawQuote}/>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                  {status.baseTokenSymbol}
                </Typography>
                <Stack direction="row" gap={2} alignItems={'center'}>
                  {/* <LiquidateDialog disabled={disabledActions} loading={loadingLiquidate} width={BTN_WIDTH}
                    liquidate={handleLiquidate}/> */}
                  <WithdrawDialog type="base" disabled={disabledActions} loading={loadingWithdrawQuote} btnWidth={BTN_WIDTH}
                    tokenSymbol={status.quoteTokenSymbol!}
                    withdraw={handleWithdrawQuote}/>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                    {"All Assets"}
                </Typography>
                <LiquidateDialog disabled={disabledActions} loading={loadingLiquidate} width={BTN_WIDTH}
                  liquidate={handleLiquidate}/>
              </Stack>
            </Stack>
            
            <Divider/>
            <Stack gap={2} mt={'auto'}>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Ownership
                  </Typography>
                </Stack>
                <TransferOwnershipDialog disabled={disabledActions} loading={loadingTransferOwnership} btnWidth={BTN_WIDTH} transferTo={handleTransferOwnership}/>
              </Stack>
              {/* <Divider/> */}
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Retirement
                  </Typography>
                </Stack>
                <RetirementDialog disabled={disabledActions} loading={loadingRetirement} btnWidth={BTN_WIDTH} retire={handleRetirement}/>
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
                onClick={handleWithdrawBase}
              >
                Withdraw Base
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
