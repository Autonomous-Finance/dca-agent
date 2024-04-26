"use client"

import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import React from "react"


import { IntervalUnit, INTERVAL_UNITS, LIQUIDITY_POOLS, LIQUIDITY_POOL_MAP, LiquidityPool, TYPE_ICON_MAP, AO_CRED_SYMBOL, cronDuration, submittableCurrency } from '@/utils/data-utils';
import AgentCodeModalButton from "@/components/AgentCodeModalButton"
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MemoryIcon from '@mui/icons-material/Memory';
import {
  createDataItemSigner,
  dryrun,
  message,
  spawn,
  monitor,
  result,
} from "@permaweb/aoconnect/browser"
import { AGENT_SOURCE } from "@/lua/agent-source"
import Log, { LogEntry } from "@/components/Log";
import { AGENT_BACKEND } from "@/utils/agent-utils";
import { useRouter } from "next/navigation";
import { shortenId } from '../../utils/ao-utils';
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import Image from "next/image";
import { Pool } from "@/hooks/usePools";
import { ArrowRightAlt } from "@mui/icons-material";

export default function CreateAgent({pools}: {pools: Pool[]}) {
  const [loading, setLoading] = React.useState(false)
  const [deployed, setDeployed] = React.useState("")

  const disableForm = loading || !!deployed

  const defaultAgentName = `MrSmith_${Math.ceil(10000 * Math.random())}`

  const [poolId, setPoolId] = React.useState<string>(pools.length ? pools[0].id : '')
  const [agentName, setAgentName] = React.useState(defaultAgentName)
  const [swapInAmount, setSwapInAmount] = React.useState("0.1")
  const [swapIntervalUnit, setSwapIntervalUnit] = React.useState<IntervalUnit>("Minutes")
  const [swapIntervalValue, setSwapIntervalValue] = React.useState("1")
  const [slippage, setSlippage] = React.useState("1.5")
  const [selectedPools, setSelectedPools] = React.useState<LiquidityPool[]>(["Bark"])

  const [validationError, setValidationError] = React.useState("");
  const [deployLog, setDeployLog] = React.useState<LogEntry[]>([])

  const router = useRouter()

  const getPoolById = (id: string) => pools.find((pool) => pool.id === id)

  const navigateToDeployedAgent = () => {
    router.replace(`/single-agent?id=${deployed}&noback=1`)
  }

  const addToLog = (entry: LogEntry) => setDeployLog((log) => [...log, entry]);

  const validateConfig = () => {
    const valid = true; // TODO refine checks and error
    if (!valid) {
      setValidationError("Invalid Configuration - ")
    }
    return valid;
  }

  const handleDeploy = async () => {
    if (!validateConfig()) {
      return
    }

    let values
    try {
      const pool = getPoolById(poolId)
      values = {
        agentName: agentName || defaultAgentName,
        baseToken: pool!.baseToken,
        quoteToken: pool!.quoteToken,
        baseTokenTicker: pool!.baseTokenInfo!.ticker,
        quoteTokenTicker: pool!.quoteTokenInfo!.ticker,
        pool: poolId,
        dex: pool!.dex,
        swapInAmount: submittableCurrency(swapInAmount),
        swapIntervalValue: Number.parseInt(swapIntervalValue).toString(),
        cronInterval: cronDuration(swapIntervalUnit, Number.parseInt(swapIntervalValue)),
        swapIntervalUnit,
        slippage,
        selectedPools
      }
    } catch (e) {
      console.log('incorrect values', e)
      return
    }

    try {
      setLoading(true);

      addToLog({text: 'Creating Agent Process on AO...', hasLink: false})

      const processId = await spawn({
        module: "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk",
        scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Process-Type", value: "AF-DCA-Agent" },
          { name: "Name", value: values.agentName },
          { name: "Cron-Interval", value: values.cronInterval },
          { name: "Cron-Tag-Action", value: "TriggerSwap" },
          { name: "Deployer", value: await window.arweaveWallet?.getActiveAddress()}
        ],
      })
      console.log("📜 LOG > processId:", processId)

      addToLog({text: 'Installing handlers...', hasLink: false})

      // This is required because the processId above is available and 
      // returned here before the SU has completed the process registration
      
      let installed = false
      let evalMsgId
      while (!installed) {
        try {
          evalMsgId = await message({
            process: processId,
            data: AGENT_SOURCE,
            signer: createDataItemSigner(window.arweaveWallet),
            tags: [{ name: "Action", value: "Eval" }],
          })
          installed = true
          console.log("📜 LOG > evalMsg:", evalMsgId)
        } catch (e) {
          console.log('500 on eval ', e)
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }

      // Initialize (& Config)

      addToLog({text: 'Initializing Agent...', hasLink: false})

      const initMsgId = await message({
        process: processId,
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Action", value: "Initialize" },
          { name: "Process-Type", value: "AF-DCA-Agent" },
          { name: "Initializer", value: await window.arweaveWallet?.getActiveAddress()},
          { name: "AgentName", value: values.agentName },
          { name: "BaseToken", value: values.baseToken },
          { name: "QuoteToken", value: values.quoteToken },
          { name: "BaseTokenTicker", value: values.baseTokenTicker },
          { name: "QuoteTokenTicker", value: values.quoteTokenTicker },
          { name: "Pool", value: values.pool },
          { name: "Dex", value: values.dex },
          { name: "SwapInAmount", value: values.swapInAmount },
          { name: "SwapIntervalValue", value: values.swapIntervalValue },
          { name: "SwapIntervalUnit", value: values.swapIntervalUnit },
          { name: "Slippage", value: values.slippage },
        ],
      })
      console.log("📜 LOG > initMsg:", initMsgId)

      const initRes = await result({
        message: initMsgId,
        process: processId,
      })
      console.log('📜 LOG > Initialization result: ', initRes)

      if (initRes.Error) {
        addToLog({text: "Failed to initialize agent. Please try again.", isError: true, hasLink: false})
        setLoading(false);
        return
      }
      
      // cron monitoring

      addToLog({text: 'Starting cron monitor...', hasLink: false})
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // monitor issues ? 

      const monitorMsgId = await monitor({
        process: processId,
        signer: createDataItemSigner(window.arweaveWallet),
      });
      
      console.log('📜 LOG > monitorMsgId:', monitorMsgId)
      
      // Register with Agent Backend
      
      addToLog({text: 'Registering agent...', hasLink: false})

      const registerMsgId = await message({
        process: AGENT_BACKEND,
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Action", value: "RegisterAgent" },
          { name: "Agent", value: processId },
          { name: "AgentName", value: values.agentName},
          { name: "SwapInAmount", value: values.swapInAmount },
          { name: "SwapIntervalValue", value: values.swapIntervalValue },
          { name: "SwapIntervalUnit", value: values.swapIntervalUnit },
          { name: "QuoteTokenTicker", value: values.quoteTokenTicker },
          { name: "BaseTokenTicker", value: values.baseTokenTicker },
        ]
      })
      console.log("📜 LOG > registerMsg:", registerMsgId)
      const res = await result({
        message: registerMsgId,
        process: AGENT_BACKEND,
      })
      console.log('📜 LOG > Registration result: ', res)
      if (res.Error) {
        addToLog({text: "Failed to register with Agent Backend. Please try again.", isError: true, hasLink: false})
        setLoading(false);
        return
      }

      const status = await dryrun({
        process: processId,
        data: "",
        tags: [{ name: "Action", value: "GetStatus" }],
      })
      console.log("📜 LOG > dryRun Status:", status)

      const allAgents = await dryrun({
        process: AGENT_BACKEND,
        data: "",
        tags: [
          { name: "Action", value: "GetAllAgentsPerUser" },
          { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
        ],
      })
      console.log("📜 LOG > dryRun GetAllAgentsPerUser:", allAgents)

      addToLog({text: "Successfully deployed.", hasLink: false})
      
      const logEntries: LogEntry[] = [
        {
          text: 'Agent process',
          hasLink: true,
          linkId: processId,
          isMessage: false
        },
        {
          text: 'Handlers installation',
          hasLink: true,
          linkId: evalMsgId!,
          isMessage: true
        },
        {
          text: 'Initialization',
          hasLink: true,
          linkId: initMsgId,
          isMessage: true
        },
        {
          text: 'Registration',
          hasLink: true,
          linkId: registerMsgId,
          isMessage: true
        }
      ];
      logEntries.forEach((item: LogEntry) => addToLog(item));
      setDeployed(processId)
      window.localStorage.setItem("agentProcess", processId)
    } catch (e) {
      console.error(e)
      addToLog({text: "Failed to deploy DCA agent. Please try again.", isError: true, hasLink: false})
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  const BTN_WIDTH_REM = 20

  const selectedPoolChip = ({selPool}: {selPool: LiquidityPool}) => (
    <Chip key={selPool} label={selPool} sx={{fontSize: '1rem', letterSpacing: '0.1rem', height: '23px', padding: '0 4px'}}
      onDelete={() =>
        setSelectedPools(selectedPools.filter((pool) => pool !== selPool))
      }
      deleteIcon={
        <CancelIcon onMouseDown={(event) => event.stopPropagation()} />
      }
    /> 
  )

  const displayedPair = poolId ? `${getPoolById(poolId)?.baseTokenInfo?.ticker}/${getPoolById(poolId)?.quoteTokenInfo?.ticker}` : "-/-"

  return (
    <Box margin={'4rem auto 0'}>
      <Box maxWidth={'min-content'} mx={'auto'} pb={8}>
        <Paper variant="outlined" sx={{ padding: 4}}>
          <Stack direction={'row'} gap={4} minHeight={'37.5rem'} maxHeight={'50rem'} overflow={'auto'}>

            <Stack gap={4} alignItems={'stretch'} width={'43.75'} pr={4} borderRight={deployLog.length > 0 ? '1px solid var(--mui-palette-divider)' : ''}>
              <Typography variant="h5">Create New Agent</Typography>

              <Stack direction="row" gap={2} alignItems="stretch">
                <Stack direction="column" sx={{minWidth: `${BTN_WIDTH_REM}rem`}} gap={3} alignItems="flex-start">
                  <FormControl fullWidth>
                    <TextField
                      disabled={loading}
                      size="small"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      type="text"
                      label="Name"
                      placeholder="MrSmith_2143"
                    />
                  </FormControl>
                  <Stack width={'100%'} gap={3}>
                    <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                      <Typography variant="body1" color="text.primary" fontSize={'1.25rem'}>Currencies</Typography>
                      <Typography variant="body1" color="text.secondary">
                        powered by{" "}
                        <Link href='https://dexscreener.arweave.dev/' 
                          sx={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}
                        >
                            DEXI <Stack py={'1px'} px={'2px'} bgcolor={'#000'} justifyContent={'center'} alignItems={'center'}><Image alt="icon" width={26} height={26} src={'/dexi.svg'} /></Stack>
                        </Link>
                      </Typography>
                      {/* <Typography variant="body1" color="text.secondary" display={'flex'} alignItems={'center'} gap={1}>
                        powered by <Link href='https://dexscreener.arweave.dev/' display={'flex'} alignItems={'center'}><img alt="icon" height={'30px'} src={'/dexi.png'} /></Link>
                      </Typography> */}
                    </Stack>
                    <FormControl fullWidth>
                      <InputLabel id="token-pair-label">Token Pair (Base / Quote)</InputLabel>
                      <Select
                        labelId="token-pair-label"
                        id="token-pair"
                        value={poolId}
                        renderValue={() => displayedPair}
                        label="Token Pair (Base / Quote)"
                        disabled={disableForm}
                        onChange={(e) => setPoolId(e.target.value)}
                      >
                        {pools.map((pool: Pool) => (
                          <MenuItem key={pool.id} value={pool.id}>
                            <Stack direction={'row'} justifyContent={'space-between'} width="100%">
                              <Typography fontSize={'1.125rem'}>
                                {pool.baseTokenInfo?.ticker}/{pool.quoteTokenInfo?.ticker}
                              </Typography>
                              <Typography fontSize={'1rem'} color="text.secondary" sx={{display: 'flex', alignItems: 'center'}}>
                                ({pool.quoteTokenInfo?.ticker} <ArrowRightAlt /> {pool.baseTokenInfo?.ticker})
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="liquidity-pools">
                        {`Liquidity Pools for ${displayedPair}`}
                      </InputLabel>
                      <Select
                        id="liquidity-pools"
                        value={selectedPools}
                        label={`Liquidity Pools for ${displayedPair}`}
                        multiple
                        required
                        renderValue={(selected) => (
                          <Stack gap={1} direction="row" flexWrap="wrap">
                            {selected.map((selPool) => selectedPoolChip({selPool}))}
                          </Stack>
                        )}
                      >
                        {LIQUIDITY_POOLS.map((pool) => (
                          <MenuItem key={pool} value={pool}
                              disabled={pool !== "Bark"}
                              sx={{justifyContent: 'space-between'}}
                              onClick={() => setSelectedPools(pools => pools.includes(pool) ? pools.filter(p => p !== pool) : [...pools, pool])}
                            >
                              <Stack direction={'row'} justifyContent={'space-between'} width="100%">
                                <Typography fontSize={'1.125rem'}>{pool}</Typography>
                                <Typography fontFamily={'Courier New'} fontSize={'1.125rem'}>
                                  {shortenId(LIQUIDITY_POOL_MAP[pool].processId)}
                                </Typography>
                              </Stack>
                              <CheckIcon color="info" sx={{marginLeft: '0.25rem', opacity : selectedPools.includes(pool) ? 1 : 0}}/>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormGroup sx={{marginTop: -2}}>
                      <FormControlLabel disabled control={<Checkbox />} label="Use Global RFQ" />
                    </FormGroup>
                  </Stack>
                  <Stack width={'100%'} gap={3}>
                    <Typography variant="body1" color="text.primary" fontSize={'1.25rem'}>DCA Configuration</Typography>
                    
                    <Stack direction="row" gap={1} sx={{width: "100%"}}>
                      <FormControl fullWidth>
                        <TextField
                          disabled={loading}
                          required
                          size="small"
                          value={swapIntervalValue}
                          onChange={(e) => setSwapIntervalValue(e.target.value)}
                          type="number"
                          label="Interval"
                          // error={error !== ""}
                          // helperText={`Integer value`}
                        />
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="interval-unit-label"></InputLabel>
                        <Select
                          size="small"
                          disabled={loading}
                          labelId="interval-unit-label"
                          id="interval-unit"
                          value={swapIntervalUnit}
                          label=""
                          onChange={(e) => setSwapIntervalUnit(e.target.value as IntervalUnit)}
                        >
                          {INTERVAL_UNITS.map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                    
                    <TextField
                      disabled={loading}
                      required
                      size="small"
                      value={swapInAmount}
                      onChange={(e) => setSwapInAmount(e.target.value)}
                      // type="number"
                      label="Swap Amount"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">{AO_CRED_SYMBOL}</InputAdornment>
                        ),
                      }}
                      // error={error !== ""}
                      helperText={`Minimum: 0.1 ${AO_CRED_SYMBOL}`}
                    />
                    <TextField
                      disabled={loading}
                      size="small"
                      sx={{ width: "100%" }}
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      // type="number"
                      label="Max Slippage"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      }}
                      // error={error !== ""}
                      // helperText={error}
                    />
                  </Stack>
                  <Stack width="100%" mt="auto" gap={1}>
                    {validationError && <Typography color="error">{validationError}</Typography>}
                    <Button
                      sx={{ height: 40, width: '100%' }}
                      disabled={disableForm}
                      startIcon={loading ? <CircularProgress size={14} /> : undefined}
                      endIcon={<RocketLaunchIcon />}
                      variant="contained"
                      color="success"
                      onClick={handleDeploy}
                    >
                      Deploy DCA Agent
                    </Button>
                  </Stack>
                </Stack>
                <Box sx={{flexGrow: 1, position: 'relative', transform: 'translateX(8px)' }}>
                  <Box position={"absolute"} top={0} left={0} width={'100%'} height={'100%'}
                    display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'flex-start'}
                    sx={{opacity: 0.05}}
                  >
                    <Box sx={{marginTop: '-50px'}}><Image alt="icon" width={200} height={200} src={'/ao.svg'}/></Box>
                    <Box sx={{marginTop: '-34px'}}><Image alt="icon" width={200} height={200} src={TYPE_ICON_MAP["Process"]}/></Box>
                  </Box>
                  {loading && (
                    <Box position={"absolute"} top={'191px'} left={0} width={'100%'}
                      display={'flex'} justifyContent={'center'}>
                      <CircularProgress size={64}/>
                    </Box>
                  )}
                  <Box
                    sx={{ mx: 'auto', width: `${BTN_WIDTH_REM}rem`, height: "100%" }}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    flexDirection="column"
                  >
                    {/* <Box> */}
                      <Typography paragraph>
                        Deployment will create an agent process as configured.
                      </Typography>
                      <Typography paragraph>
                        You own and control this agent via your connected AR wallet account.
                      </Typography>
                    {/* </Box> */}
                    <AgentCodeModalButton />
                  </Box>
                </Box>
              </Stack>
              
              {deployed && (
                <Button
                  sx={{ height: 40, width: `${BTN_WIDTH_REM}rem`, margin: '1rem auto 0'}}
                  endIcon={<MemoryIcon/>}
                  variant="contained"
                  color="primary"
                  onClick={navigateToDeployedAgent}
                >
                  Control Panel
                </Button>
              )}

            </Stack>

            {deployLog.length > 0 && (
              <Stack flexGrow={1} gap={1} width={400}>
                <Typography variant="h6">
                  Deploy Log
                </Typography>
                <Log log={deployLog}/>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}