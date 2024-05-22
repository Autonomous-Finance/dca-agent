import { connect } from "@permaweb/aoconnect/browser"

const DEXI_CU_URL = 'https://cu.dataos.so'

export const { dryrun: dryrunDexiCU } = connect({
  CU_URL: DEXI_CU_URL,
})

export const { dryrun } = connect({
  // CU_URL: DEXI_CU_URL,
})