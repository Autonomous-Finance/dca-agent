# Simple DCA Bot on AO

A DCA bot that swaps TargetToken for BaseToken at regular intervals. 


It works in conjunction with 2 Cron process proxies
- 1 for triggering the swap
- 1 for updating the price as per associated liquidity pool

## Features

- direct interaction with pool, no router
- single owner (initially the deployment signer, but can be changed),
- single currency pair
- bot is supposed to be owned / controlled by user with an arweave wallet, not by another bot (msg.From vs. Owner)

### Operate
- allows loading up with base token
- allows withdrawals of base or target token
- allows for total liquidation (return all in base token)

### Configure
- target token, slippage, swapAmount are configured only once @ initialization
- base token can't be configured


# Bot Deployment

## Prepare Lua code
Put all lua code into a single file using amalg - builds a single amalgamation file.
https://luarocks.org/modules/siffiejoe/amalg

To build on osx:
`/opt/homebrew/bin/amalg.lua -s process.lua -o build/output.lua ownership.ownership bot.bot validations.validations`

## In App
*swuw* == "signed with user wallet"

1. user configures the bot with target token, slippage, swap amount
2. user confirms deployment
   1. create main bot process (*swuw*)
   2. upon deployment confirmation, load `process.lua` 
   3. upon eval confirmation, `"Initialize"` (*swuw*)
   4. upon initialization confirmation, spawn cron proxy processes
      1. spawn process A, load `trigger-price–update.lua`, `"Initialize"` (*swuw*)
      2. spawn process B, load `trigger-swap.lua`, `"Initialize"` (*swuw*)


# TODO Requirements

Clarify: what constitutes a bot status ?
  - bot process state 
  - cron proxy processes state
  - peripheral info additional storage on arweave


# Dev Plan

Create working version for each iteration

1. Complete life cycle management for a simple process that has initialization, access control, top up and withdrawal, as well as retirement. Bot can only be configured in terms of currency. Should list past processes in the table.
2. Fully fledged dca bot with automation, includes state display of the active bot.
3. Add metrics for bot performance
5. Prettify UI, add animated stepper for deployment progress display
6. Reconsider bot design for blueprint-grade code quality (especially names & convenience functions)






This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
