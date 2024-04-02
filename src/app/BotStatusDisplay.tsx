"use client"

import { Pause, PlayArrow } from "@mui/icons-material"
import { Chip, Paper, Stack, Typography } from "@mui/material"
import React from "react"

import { readBotStatus } from "@/api/dca-bot"
import type { BotStatus } from "@/api/dca-bot"

export function BotStatusDisplay(props: { initialBotStatus: BotStatus }) {
  const { initialBotStatus } = props

  const [botStatus, setBotStatus] = React.useState<BotStatus | null>(
    initialBotStatus,
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      readBotStatus().then(setBotStatus)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Stack gap={4} alignItems="flex-start">
      <Typography variant="h6">Active Bot</Typography>
      {botStatus !== null && (
        <>
        {/* TODO handle states properly */}
          {botStatus.type === "Active" ? (
            <>
              <Chip label="Active" color="success" icon={<PlayArrow />} />
              <Stack gap={0.5}>
                <Typography>
                  <Typography color="text.secondary" component="span">
                    Next BUY:{" "}
                  </Typography>
                  {botStatus.nextBuy.toString()}
                  {/* TODO format time */}
                </Typography>
                <Typography>
                  <Typography color="text.secondary" component="span">
                    Base Token Reserves:{" "}
                  </Typography>
                  {botStatus.baseTokenBalance.toString()}
                  {/* TODO format currency */}
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Chip label="Paused" color="warning" icon={<Pause />} />
            </>
          )}
        </>
      )}
    </Stack>
  )
}
