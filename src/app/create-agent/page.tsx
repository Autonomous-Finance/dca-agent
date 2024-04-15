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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import React from "react"


import { IntervalUnit, BASE_CURRENCIES, INTERVAL_UNITS, BaseToken, LIQUIDITY_POOLS, LIQUIDITY_POOL_MAP, QUOTE_CURRENCIES, LiquidityPool, TYPE_ICON_MAP, credSymbol } from '@/utils/data-utils';
import AgentCodeModalButton from "@/components/AgentCodeModalButton"
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MemoryIcon from '@mui/icons-material/Memory';
import {
  createDataItemSigner,
  dryrun,
  message,
  spawn,
  result,
} from "@permaweb/aoconnect/browser"
import { BOT_SOURCE } from "@/lua/bot-source"
import { BASE_CURRENCY_PROCESS_MAP } from '../../utils/data-utils';
import Log, { LogEntry } from "@/components/Log";
import { REGISTRY } from "@/utils/agent-utils";
import { useRouter } from "next/navigation";
import { shortenId } from '../../utils/ao-utils';
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import Image from "next/image";

export default function CreateAgent() {
  const [loading, setLoading] = React.useState(false)
  const [deployed, setDeployed] = React.useState("")

  const disableForm = loading || !!deployed

  const defaultAgentName = `MrSmith_${Math.ceil(10000 * Math.random())}`

  const [currency, setCurrency] = React.useState<BaseToken>("BRKTST")
  const [agentName, setAgentName] = React.useState(defaultAgentName)
  const [swapInAmount, setSwapInAmount] = React.useState("100")
  const [swapIntervalUnit, setSwapIntervalUnit] = React.useState<IntervalUnit>("Days")
  const [swapIntervalValue, setSwapIntervalValue] = React.useState("10")
  // const [slippage, setSlippage] = React.useState("")
  const [selectedPools, setSelectedPools] = React.useState<LiquidityPool[]>(["Bark"])

  const [validationError, setValidationError] = React.useState("");
  const [deployLog, setDeployLog] = React.useState<LogEntry[]>([])

  const router = useRouter()

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

    try {
      setLoading(true);

      addToLog({text: 'Creating Agent Process on AO...', hasLink: false})

      const processId = await spawn({
        module: "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk",
        scheduler: "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog",
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Process-Type", value: "AF-DCA-Agent" },
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
            data: BOT_SOURCE,
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

      addToLog({text: 'Initializing...', hasLink: false})

      const initMsgId = await message({
        process: processId,
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Action", value: "Initialize" },
          { name: "Process-Type", value: "AF-DCA-Agent" },
          { name: "Initializer", value: await window.arweaveWallet?.getActiveAddress()},
          { name: "AgentName", value: agentName || defaultAgentName },
          { name: "BaseToken", value: BASE_CURRENCY_PROCESS_MAP[currency] },
          { name: "SwapInAmount", value: swapInAmount },
          { name: "SwapIntervalValue", value: swapIntervalValue },
          { name: "SwapIntervalUnit", value: swapIntervalUnit },
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

      addToLog({text: 'Registering agent...', hasLink: false})

      // Register with Registry
      const registerMsgId = await message({
        process: REGISTRY,
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Action", value: "RegisterAgent" },
          { name: "Agent", value: processId },
          { name: "AgentName", value: agentName || defaultAgentName},
          { name: "SwapInAmount", value: swapInAmount },
          { name: "SwapIntervalValue", value: swapIntervalValue },
          { name: "SwapIntervalUnit", value: swapIntervalUnit },
        ]
      })
      console.log("📜 LOG > registerMsg:", registerMsgId)
      const res = await result({
        message: registerMsgId,
        process: REGISTRY,
      })
      console.log('📜 LOG > Registration result: ', res)
      if (res.Error) {
        addToLog({text: "Failed to register agent with Registry. Please try again.", isError: true, hasLink: false})
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
        process: REGISTRY,
        data: "",
        tags: [
          { name: "Action", value: "GetAllAgents" },
          { name: "Owned-By", value: await window.arweaveWallet?.getActiveAddress() }
        ],
      })
      console.log("📜 LOG > dryRun GetAllAgents:", allAgents)

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

  const BTN_WIDTH = 250

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

  return (
    <Box margin={'4rem auto 0'}>
      <Box maxWidth={'min-content'} mx={'auto'}>
        <Paper variant="outlined" sx={{ padding: 4}}>
          <Stack gap={4} alignItems={'stretch'} width={600}>
            <Typography variant="h6">Create New Agent</Typography>

            <Stack direction="row" gap={2} alignItems="stretch">
              <Stack direction="column" sx={{minWidth: BTN_WIDTH}} gap={3} alignItems="flex-start">
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
                  <Typography variant="body1" color="text.primary">Currencies</Typography>
                  <Stack direction={'row'} gap={1}>
                    <FormControl fullWidth>
                      <InputLabel id="base-token-label">Base Token</InputLabel>
                      <Select
                        labelId="base-token-label"
                        id="base-token"
                        value={currency}
                        label="Base Token"
                        disabled={disableForm}
                        onChange={(e) => setCurrency(e.target.value as BaseToken)}
                      >
                        {BASE_CURRENCIES.map((currency) => (
                          <MenuItem key={currency} value={currency} disabled={currency !== "BRKTST"}>
                            {currency}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="quote-token-label">Quote Token</InputLabel>
                      <Select
                        labelId="quote-token-label"
                        id="quote-token"
                        value={credSymbol}
                        label="quote Token"
                        disabled={disableForm}
                      >
                        {QUOTE_CURRENCIES.map((currency) => (
                          <MenuItem key={currency} value={currency} disabled={currency !== credSymbol}>
                            {currency}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <FormControl fullWidth>
                    <InputLabel id="liquidity-pools">
                      {`Liquidity Pools for BRKTST/${credSymbol}`}
                    </InputLabel>
                    <Select
                      id="liquidity-pools"
                      value={selectedPools}
                      label={`Liquidity Pools for BRKTST/${credSymbol}`}
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
                  <Typography variant="body1" color="text.primary">DCA Configuration</Typography>
                  
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
                        // helperText={error}
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
                    type="number"
                    label="Swap Amount"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">{credSymbol}</InputAdornment>
                      ),
                    }}
                    // error={error !== ""}
                    // helperText={error}
                  />
                </Stack>
                {/* <TextField
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
                /> */}
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
              <Box sx={{flexGrow: 1, position: 'relative' }}>
                <Box position={"absolute"} top={0} left={0} width={'100%'} height={'100%'}
                  display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'flex-start'}
                  sx={{opacity: 0.05}}
                >
                  <Box sx={{marginTop: '-50px'}}><Image alt="icon" width={200} height={200} src={'/ao.svg'}/></Box>
                  <Box sx={{marginTop: '-30px'}}><Image alt="icon" width={200} height={200} src={TYPE_ICON_MAP["Process"]}/></Box>
                </Box>
                <Box
                  sx={{ mx: 'auto', width: BTN_WIDTH, height: "100%" }}
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

            {deployLog.length > 0 && <Divider />}

            <Log log={deployLog}/>
            
            {deployed && (
              <Button
                sx={{ height: 40, width: BTN_WIDTH}}
                endIcon={<MemoryIcon/>}
                variant="contained"
                color="primary"
                onClick={navigateToDeployedAgent}
              >
                Control Panel
              </Button>
            )}

          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}