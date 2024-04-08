"use client"

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material"
import React from "react"


import { IntervalType, TARGET_CURRENCIES, INTERVAL_TYPES, TargetToken, TYPE_ICON_MAP } from '@/utils/data-utils';
import BotCodeModalButton from "@/components/BotCodeModalButton"
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
import { CURRENCY_PROCESS_MAP } from '../utils/data-utils';
import LinkIcon from '@mui/icons-material/Link';
import { shortenId } from "@/utils/ao-utils"
import Log, { LogEntry } from "@/components/Log";


export function CreateBot(props: {checkOutDeployedBot: () => void}) {
  const [loading, setLoading] = React.useState(false)
  const [deployed, setDeployed] = React.useState(false)

  const disableForm = loading || deployed

  const [currency, setCurrency] = React.useState<TargetToken>("BRKTST")
  // const [amount, setAmount] = React.useState("")
  // const [slippage, setSlippage] = React.useState("")
  // const [intervalType, setIntervalType] = React.useState<IntervalType>("Days")
  // const [intervalValue, setIntervalValue] = React.useState("")
  
  const [validationError, setValidationError] = React.useState("");
  const [deployLog, setDeployLog] = React.useState<LogEntry[]>([])
      
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

      addToLog('Creating Bot Process on AO...')

      const processId = await spawn({
        module: "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk",
        scheduler: "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog",
        signer: createDataItemSigner(window.arweaveWallet),
      })
      console.log("📜 LOG > processId:", processId)

      addToLog('Installing handlers...')

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

      const initMsgId = await message({
        process: processId,
        signer: createDataItemSigner(window.arweaveWallet),
        tags: [
          { name: "Action", value: "Initialize" },
          { name: "TargetToken", value: CURRENCY_PROCESS_MAP[currency] },
        ],
      })
      console.log("📜 LOG > initMsg:", initMsgId)

      const status = await dryrun({
        process: processId,
        data: "",
        tags: [{ name: "Action", value: "Status" }],
      })
      console.log("📜 LOG > dryRun Status:", status)

      addToLog("Successfully deployed and initalized.")
      
      const logEntries: LogEntry[] = [
        {
          text: 'Bot process',
          linkId: processId
        },
        {
          text: 'Handlers installation',
          linkId: evalMsgId!
        },
        {
          text: 'Initialization',
          linkId: initMsgId
        }
      ];
      logEntries.forEach((item: LogEntry) => addToLog(item));
      setDeployed(true)
      window.localStorage.setItem("botProcess", processId)
    } catch (e) {
      console.error(e)
      "Failed to deploy DCA bot. Please try again."
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  const BTN_WIDTH = 250
  return (
    <Box maxWidth={'min-content'} mx={'auto'}>
      <Paper variant="outlined" sx={{ padding: 4}}>
        <Stack gap={4} alignItems={'stretch'} width={600}>
          <Typography variant="h6">Create New Bot</Typography>

          <Stack direction="row" gap={2} alignItems="stretch">
            <Stack direction="column" sx={{minWidth: BTN_WIDTH}} gap={3} alignItems="flex-start">
              <FormControl fullWidth>
                <InputLabel id="target-currency-label">Target Token</InputLabel>
                <Select
                  labelId="target-currency-label"
                  id="target-currency"
                  value={currency}
                  label="Target Currency"
                  disabled={disableForm}
                  onChange={(e) => setCurrency(e.target.value as TargetToken)}
                >
                  {TARGET_CURRENCIES.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* <Stack direction="row" gap={1} sx={{width: "100%"}}>
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
                  Deploy DCA Bot
                </Button>
              </Stack>
            </Stack>
            <Box sx={{flexGrow: 1, position: 'relative' }}>
              {/* <Box position={"absolute"} top={0} left={0} width={'100%'} height={'100%'}
                display={'flex'} alignItems={'center'} justifyContent={'center'}
                sx={{opacity: 0.025}}
              >
                <Image alt="icon" width={200} height={200} src={TYPE_ICON_MAP["Process"]}/>
              </Box> */}
              <Box
                sx={{ mx: 'auto', width: BTN_WIDTH, height: "100%" }}
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                flexDirection="column"
              >

                <Typography paragraph>
                  Deployment will create a bot process as configured.
                </Typography>
                <Typography paragraph>
                  You own and control this bot via your connected AR wallet account.
                </Typography>
                <BotCodeModalButton />
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
              onClick={props.checkOutDeployedBot}
            >
              Bot Dashboard
            </Button>
          )}

        </Stack>
      </Paper>
    </Box>
  )
}
