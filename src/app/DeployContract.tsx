"use client"

import { Button, TextField } from "@mui/material"
import {
  createDataItemSigner,
  dryrun,
  message,
  spawn,
  result,
} from "@permaweb/aoconnect/browser"

import React from "react"

export function DeployContract() {
  const [sourceCode, setSourceCode] = React.useState(`Handlers.add(
    "Ping",
    Handlers.utils.hasMatchingTag("Action", "Ping"),
    function(msg)
      Handlers.utils.reply("pong")(msg)
    end
  )`)

  return (
    <>
      <TextField
        sx={{ width: 800 }}
        rows={20}
        multiline
        variant="outlined"
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
      />
      <Button
        variant="contained"
        onClick={async () => {
          const processId = await spawn({
            module: "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk",
            scheduler: "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog",
            signer: createDataItemSigner(window.arweaveWallet),
          })
          console.log("📜 LOG > processId:", processId)

          const evalMsg = await message({
            process: "plOeYjtAX0Ksv50Nhx95IaSLofHxmAS9Xw1AsM8T0OY ",
            data: sourceCode,
            signer: createDataItemSigner(window.arweaveWallet),
            tags: [{ name: "Action", value: "Eval" }],
          })
          console.log("📜 LOG > evalMsg:", evalMsg)

          // const test = await dryrun({
          //   process: "plOeYjtAX0Ksv50Nhx95IaSLofHxmAS9Xw1AsM8T0OY ",
          //   data: "",
          //   tags: [{ name: "Action", value: "Ping" }],
          // })
          // console.log("📜 LOG > dryRun:", test)

          const MATCHER = "sv19re5wxgxf0yHRezHh0shuP-UkRRO8qKP2R50XGs4"
          const testOwner = await message({
            process: MATCHER,
            tags: [{ name: "Action", value: "ShowOwner" }],
            signer: createDataItemSigner(window.arweaveWallet),
          })
          console.log("Message sent: ", testOwner)
          const res = await result({
            // the arweave TXID of the message
            message: testOwner,
            // the arweave TXID of the process
            process: MATCHER,
          })

          console.log("OWNER: ", res)
        }}
      >
        Deploy contract
      </Button>
    </>
  )
}
