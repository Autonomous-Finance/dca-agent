#!/usr/bin/env node

import Irys from "@irys/sdk"
import Arweave from "arweave"
import { config } from "dotenv"

import { defaultCacheOptions, WarpFactory } from "warp-contracts"

import { readdir, stat } from "fs/promises"
import { join } from "path"

config()
const DEPLOY_FOLDER = "./dist"
const DEPLOY_KEY = process.env.DEPLOY_KEY
const ANT_CONTRACT = process.env.ARNS_ANT_CONTRACT

async function getFolderSize(folderPath) {
  let totalSize = 0

  async function calculateSize(dirPath) {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        await calculateSize(fullPath)
      } else {
        const stats = await stat(fullPath)
        totalSize += stats.size
      }
    }
  }

  await calculateSize(folderPath)
  return totalSize
}

async function deploy() {
  if (!DEPLOY_KEY) throw new Error("DEPLOY_KEY not configured")
  if (!ANT_CONTRACT) throw new Error("ANT_CONTRACT not configured")

  const jwk = JSON.parse(Buffer.from(DEPLOY_KEY, "base64").toString("utf-8"))
  const irys = new Irys({
    network: "mainnet",
    // url: "https://turbo.ardrive.io",
    token: "arweave",
    key: jwk,
  })
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  })

  const warp = WarpFactory.custom(arweave, defaultCacheOptions, "mainnet")
    .useArweaveGateway(defaultCacheOptions)
    .build()
  const warpContract = warp.contract(ANT_CONTRACT).connect(jwk)
  const contractState = (await warpContract.readState()).cachedValue.state
  const balance = await irys.getBalance("yqRGaljOLb2IvKkYVa87Wdcc8m_4w6FI58Gej05gorA")
  console.log("📜 LOG > node balance:", irys.utils.fromAtomic(balance), irys.token)

  // const fundTx = await irys.fund(irys.utils.toAtomic(0.1))
  // console.log(
  //   `📜 LOG > Successfully funded ${irys.utils.fromAtomic(fundTx.quantity)} ${irys.token}`,
  // )

  
  const folderSize = await getFolderSize(DEPLOY_FOLDER)
  console.log("📜 LOG > folderSize:", folderSize, "bytes")
  
  const price = await irys.getPrice(folderSize)
  console.log("📜 LOG > total cost:", irys.utils.fromAtomic(price), irys.token)
  
  if (irys.utils.fromAtomic(balance).lt(irys.utils.fromAtomic(price))) {
    throw new Error("Insufficient balance")
  }
  
  console.log(contractState)
  console.log(`Deploying ${DEPLOY_FOLDER} folder`)

  const txResult = await irys.uploadFolder(DEPLOY_FOLDER, {
    indexFile: "index.html",
    keepDeleted: false, // Whether to keep now deleted items from previous uploads
  })

  await new Promise((r) => setTimeout(r, 1000))
  await warpContract.writeInteraction(
    {
      function: "setRecord",
      subDomain: "@",
      transactionId: txResult.id,
      ttlSeconds: 3600,
    },
    { disableBundling: true },
  )

  console.log(`📜 LOG > Deployed [${txResult.id}] to [${contractState.name}]`)
}

deploy().then()
