"use client"

import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material"
import React from "react"

import { AgentStatusDisplay } from "./AgentStatusDisplay"
import { depositToAgent, liquidate, pauseAgent as pauseToggleAgent, retireAgent, transferOwnership, withdrawBase, withdrawQuote } from "@/utils/agent-utils"
import TransferOwnershipDialog from "@/components/TransferOwnershipDialog"
import Log, { LogEntry } from "@/components/Log"
import TopUpDialog from "@/components/TopUpDialog"
import WithdrawDialog from "@/components/WithdrawDialog"
import { isLocalDev } from "@/utils/debug-utils"
import RetirementDialog from "@/components/RetirementDialog"
import { usePolledAgentStatusContext } from "@/components/PolledAgentStatusProvider"
import LiquidateDialog from "@/components/LiquidateDialog"
import { credSymbol, displayableCurrency } from "@/utils/data-utils"
import PauseDialog from "@/components/PauseDialog"

export function AgentPanel() {
  const [actionLog, setActionLog] = React.useState<LogEntry[]>([])
  
  const [loadingTopUp, setLoadingTopUp] = React.useState(false)
  const [loadingWithdrawQuote, setLoadingWithdrawQuote] = React.useState(false)
  const [loadingWithdrawBase, setLoadingWithdrawBase] = React.useState(false)
  const [loadingLiquidate, setLoadingLiquidate] = React.useState(false)
  const [loadingTransferOwnership, setLoadingTransferOwnership] = React.useState(false)
  const [loadingRetirement, setLoadingRetirement] = React.useState(false)
  const [loadingPause, setLoadingPause] = React.useState(false)
  const [executionMessage, setExecutionMessage] = React.useState("")

  const [keepActionsDisabled, setKeepActionsDisabled] = React.useState(false)

  const agent = usePolledAgentStatusContext();

  const { isWithdrawing, isDepositing, isLiquidating } = agent?.status ?? {}

  React.useEffect(() => {
    if (!agent?.status?.Agent) return

    if (!isDepositing && loadingTopUp) {
      setLoadingTopUp(false)
      setExecutionMessage(``)
      addToLog({ text: 'Deposit successful. MessageId', hasLink: true, linkId: agent.status.lastDepositNoticeId, isMessage: true})
    }
    if (!isWithdrawing && (loadingWithdrawQuote || loadingWithdrawBase)) {
      setLoadingWithdrawQuote(false)
      setLoadingWithdrawBase(false)
      setExecutionMessage(``)
      addToLog({ text: 'Withdrawal successful. MessageId', hasLink: true, linkId: agent.status.lastWithdrawalNoticeId, isMessage: true})
    }
    if (!isLiquidating && loadingLiquidate) {
      setLoadingLiquidate(false)
      setExecutionMessage(``)
      addToLog({ text: 'Liquidation successful. MessageId', hasLink: true, linkId: agent.status.lastLiquidationNoticeId, isMessage: true})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawing, isDepositing, isLiquidating, agent?.status?.Agent])

  if (!agent) return <></>

  const status = agent.status

  if (!status) return <></>

  const executingOnAssets = loadingTopUp || loadingWithdrawQuote || loadingWithdrawBase || loadingLiquidate
  const tempDisablingActions = executingOnAssets || loadingTransferOwnership || loadingPause || loadingRetirement
  const areActionsDisabled = keepActionsDisabled || tempDisablingActions

  const addToLog = (entry: LogEntry, error?: string) => {
    if (error && isLocalDev()) {
      entry.text = `${entry.text} - ${error}`
    }
    setActionLog((log) => [...log, entry])
  }

  const handleDeposit = async (amount: string) => {
    setLoadingTopUp(true)
    setExecutionMessage(`Depositing ${displayableCurrency(amount)} ${credSymbol} to agent...`)
    addToLog({text: `Depositing ${displayableCurrency(amount)} ${credSymbol} to agent...`, hasLink: false})
    const depositResult = await depositToAgent(agent.agentId, amount)
    if (depositResult?.type === "Success") {
      const msgId = depositResult.result
      addToLog({ text: 'Deposit initiated. MessageID', hasLink: true, linkId: msgId, isMessage: true})
    } else {
      addToLog({text: `Failed to deposit ${credSymbol}. Please try again.`, hasLink: false, isError: true}, depositResult.result)
    }
  }

  const handleWithdrawQuote = async (amount: string) => {
    setLoadingWithdrawQuote(true)
    setExecutionMessage(`Withdrawing ${displayableCurrency(amount)} ${credSymbol} from agent...`)
    addToLog({ text: `Withdrawing ${displayableCurrency(amount)} ${credSymbol} from agent...`, hasLink: false})
    const withdrawResult = await withdrawQuote(agent.agentId, amount, status.quoteToken)
    if (withdrawResult?.type === "Success") {
      const msgId = withdrawResult.result
      addToLog({ text: 'Withdrawal initiated. MessageID', linkId: msgId, isMessage: true, hasLink: true})
    } else {
      addToLog({ text: `Failed to withdraw ${credSymbol}. Please try again.`, isError: true, hasLink: false}, withdrawResult.result)
    }
  }

  const handleWithdrawBase = async (amount: string) => {
    // TODO
    setLoadingWithdrawBase(true)
    setExecutionMessage(`Withdrawing ${displayableCurrency(amount)} ${status.baseTokenSymbol} from agent...`)
    addToLog({ text: `Withdrawing ${displayableCurrency(amount)} ${status.baseTokenSymbol} from agent...`, hasLink: false})
    const withdrawResult = await withdrawBase(agent.agentId, amount, status.baseToken)
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
    setExecutionMessage(`Liquidating agent assets...`)
    addToLog({ text: `Liquidating agent. Selling base token and withdrawing...`, hasLink: false})
    const liquidationResult = await liquidate(agent.agentId)
    if (liquidationResult?.type === "Success") {
      const msgId = liquidationResult.result
      addToLog({ text: 'Liquidation initiated. Please wait a few seconds for completion. MessageID', linkId: msgId, isMessage: true, hasLink: true})
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
      setKeepActionsDisabled(true)
    } else {
      addToLog({text: `Failed to transfer ownership to ${id}. Please try again.`, hasLink: false, isError: true}, transferResult.result)
    }
  }

  const handlePauseToggle = async () => {
    const isPaused = status.paused
    setLoadingPause(true)
    addToLog({text: `${isPaused ? 'Resuming' : 'Pausing'} agent...`, hasLink: false})
    const pauseToggleResult = await pauseToggleAgent(agent.agentId)
    setLoadingPause(false)
    if (pauseToggleResult.type === "Success") {
      const msgId = pauseToggleResult.result
      addToLog({text: `Agent ${isPaused ? 'resumed' : 'paused'}. MessageID`, linkId: msgId, isMessage: false, hasLink: true})
    } else {
      addToLog({
        text: `Failed to ${isPaused ? 'resume' : 'pause'} agent.`, 
        hasLink: false, 
        isError: true
      }, pauseToggleResult.result)
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
      setKeepActionsDisabled(true)
    } else {
      addToLog({text: `Failed to retire agent. Please make sure it has zero balances and retry.`, hasLink: false, isError: true}, retirementResult.result)
    }
  }

  const BTN_WIDTH = 165
  const OVERLAY_OFFSET_PX = 16

  return (
    <Box maxWidth={'min-content'} mx={'auto'} pb={8}>
      <Paper variant="outlined" sx={{ padding: 4 }} >
        <Stack direction={'row'} gap={4} minHeight={600}>
          <Stack gap={4} width={750}
            pr={actionLog.length > 0 ? 4 : 0}
            borderRight={actionLog.length > 0 ? '1px solid var(--mui-palette-divider)' : ''}
          >
            <AgentStatusDisplay/>
            <Divider />

            <Stack gap={2} position={'relative'}>
              {/* overlay */}
              {executingOnAssets && (
                <Stack position={'absolute'} top={`${-OVERLAY_OFFSET_PX}px`} left={`${-OVERLAY_OFFSET_PX}px`} p={`${OVERLAY_OFFSET_PX}px`}
                  height={`calc(100% + ${2 * OVERLAY_OFFSET_PX}px)`} width={`calc(100% + ${2 * OVERLAY_OFFSET_PX}px)`} 
                  zIndex={10}
                  display={'flex'} justifyContent={'center'} alignItems={'center'} gap={4}
                  sx={(theme) => ({backgroundColor: `var(--mui-palette-primary-contrastText)`, opacity: 0.9})}>
                  <Typography variant="h6">{executionMessage}</Typography>
                  <CircularProgress size={32} />
                </Stack>
              )}
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                  {status.quoteTokenSymbol}
                </Typography>
                <Stack direction="row" gap={2} alignItems={'center'}>
                  <TopUpDialog disabled={areActionsDisabled} loading={loadingTopUp} btnWidth={BTN_WIDTH} 
                    tokenSymbol={status.quoteTokenSymbol!} tokenBalance={status.quoteTokenBalance}
                    topUp={handleDeposit}/>
                  <WithdrawDialog type="quote" disabled={areActionsDisabled} loading={loadingWithdrawQuote} btnWidth={BTN_WIDTH}
                    tokenSymbol={status.quoteTokenSymbol!}
                    withdraw={handleWithdrawQuote}/>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                  {status.baseTokenSymbol}
                </Typography>
                <Stack direction="row" gap={2} alignItems={'center'}>
                  <WithdrawDialog type="base" disabled={areActionsDisabled} loading={loadingWithdrawBase} btnWidth={BTN_WIDTH}
                    tokenSymbol={status.quoteTokenSymbol!}
                    withdraw={handleWithdrawBase}/>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                <Typography variant="h6">
                    {"All Assets"}
                </Typography>
                <LiquidateDialog disabled={areActionsDisabled} loading={loadingLiquidate} width={BTN_WIDTH}
                  liquidate={handleLiquidate}/>
              </Stack>
            </Stack>
            
            <Divider/>
            <Stack gap={2} mt={'auto'}>
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Status
                  </Typography>
                </Stack>
                <PauseDialog disabled={areActionsDisabled} loading={loadingPause} btnWidth={BTN_WIDTH} pause={handlePauseToggle}/>
              </Stack>     
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Ownership
                  </Typography>
                </Stack>
                <TransferOwnershipDialog disabled={areActionsDisabled} loading={loadingTransferOwnership} btnWidth={BTN_WIDTH} transferTo={handleTransferOwnership}/>
              </Stack>
              {/* <Divider/> */}
              <Stack direction="row" justifyContent={'space-between'} alignItems={'flex-end'}>
                <Stack>
                  <Typography variant="h6">
                    Retirement
                  </Typography>
                </Stack>
                <RetirementDialog disabled={areActionsDisabled} loading={loadingRetirement} btnWidth={BTN_WIDTH} retire={handleRetirement}/>
              </Stack>
            </Stack>            
          </Stack>
          {actionLog.length > 0 && (
            <Stack flexGrow={1} gap={1} width={400}>
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
