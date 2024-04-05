"use client"

import { BotStatus, readBotStatus } from "@/utils/bot-utils"
import { Pause, PlayArrow, Warning } from "@mui/icons-material"
import { Chip, Paper, Stack, Typography } from "@mui/material"
import React from "react"
import { findCurrencyById } from '../utils/data-utils';

export function BotStatusDisplay(props: { initialBotStatus: BotStatus }) {
  const { initialBotStatus } = props

  const [botStatus, setBotStatus] = React.useState<BotStatus | null>(
    initialBotStatus,
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      const update = async () => {
        const status = await readBotStatus()
        if (status?.initialized) {
          setBotStatus(status)
        }
      }
      update();
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Stack gap={4} alignItems="flex-start">
      <Typography variant="h4">DCA Bot</Typography>
      {botStatus !== null && (
        <>
        {/* TODO handle states properly */}
          <>
            {/* display chip according to balance */}
            <Chip label="No Funds" color="warning" icon={<Pause />} />
            {/* <Chip label="Active" color="success" icon={<PlayArrow />} /> */}
            <Stack gap={0.5}>
              <Typography>
                <Typography color="text.secondary" component="span">
                  Target Token:{" "}
                </Typography>
                {findCurrencyById(botStatus?.targetToken)}
              </Typography>
              {/* <Typography>
                <Typography color="text.secondary" component="span">
                  Base Token Reserves:{" "}
                </Typography>
                {botStatus.baseTokenBalance.toString()}
              </Typography> */}
            </Stack>
          </>
        </>
      )}
    </Stack>
  )
}
