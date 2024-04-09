import { Client, cacheExchange, fetchExchange } from "urql"

export const goldsky = new Client({
  url: "https://arweave-search.goldsky.com/graphql",
  exchanges: [cacheExchange, fetchExchange],
})

export const arweaveNet = new Client({
  url: "https://arweave.net/graphql",
  exchanges: [cacheExchange, fetchExchange],
})

