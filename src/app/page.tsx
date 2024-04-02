export const dynamic = "force-dynamic"

import { DeployContract } from "./DeployContract"
import { Grid } from "@mui/material"

import { LaunchBot } from "./LaunchBot"
import { BotHistory } from "./BotHistory"
import { BotStatus, readBotStatus } from "@/api/dca-bot"
import { ActiveBot } from "./ActiveBot"


export default async function HomePageServer() {
  // return <DeployContract />

  const botStatus: BotStatus | null = await readBotStatus()

  return (
    <Grid container spacing={3}>
      {!botStatus && (
        <Grid item xs={12} lg={6}>
          <LaunchBot/>
        </Grid>
      )}
      {/* {botStatus && ( */}
        <Grid item xs={12} lg={6}>
          <ActiveBot initialBotStatus={botStatus!} />
        </Grid>
      {/* )} */}
      <Grid item xs={12}>
        <BotHistory />
      </Grid>
    </Grid>
  )
}
