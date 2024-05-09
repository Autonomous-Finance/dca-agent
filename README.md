# DCA Agent on AO

This project contains a DCA agent that periodically swaps QuoteToken for BaseToken. The agent facilitates direct interaction with the associated pool without needing a routing layer.

## Key Features

- **Direct Pool Interaction**: Operates directly with the pool, bypassing routers.
- **Ownership**: Initially owned by the deployment signer, ownership can be transferred.
- **Currency Pair**: Manages a single currency pair.
- **User Control**: Designed to be owned/controlled by a user possessing an Arweave wallet rather than by another automated agent.

## Operations

- **Token Loading**: Supports loading with QuoteToken.
- **Withdrawals**: Permits the withdrawal of either Base or QuoteToken.
- **Liquidation**: Allows complete liquidation, returning assets in QuoteToken.

## Configuration
- **Initial Setup**: BaseToken, slippage, and swapAmount are set during initialization.
- **Fixed Quote Token**: The QuoteToken configuration is static and cannot be changed after initialization.

## Deployment

### Agent & Backend Deployment

#### Lua Preparation
Combine all Lua scripts into a single file for deployment:
- Use Amalg from LuaRocks: [Amalg](https://luarocks.org/modules/siffiejoe/amalg)
- Build commands for OSX:
  ```bash
  npm run build-lua-agent
  npm run build-lua-backend

#### In-App Process
- **Configuration**: The user sets up the agent specifying base token, slippage, and swap amount.
- **Deployment**: User confirms deployment, which triggers:
1. the main agent process is created and signed with the user's wallet.
2. Loading of `process.lua` upon deployment confirmation.
3. Initialization and spawning of cron proxy processes post-initialization:
   - Process A: Loads `trigger-price-update.lua` and initializes.
   - Process B: Loads `trigger-swap.lua` and initializes.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

------------------


# Autonomous DCA Agent on AO

## An agent that autonomously executes a DCA strategy on the AO platform

This Autonomous Investment Agent (AIA) executes dynamic dollar-cost-average (DCA) investment strategy across various liquidity pools within the AO ecosystem. It **automatically buys** a base token at predetermined, user-configurable intervals using a consistent amount of a quote token for each transaction.

The agent has **functional autonomy**. Once initiated, it runs on the AO platform without the need for off-chain signals or human intervention. 

The management interface of the DCA agent is facilitated through a frontend hosted on the Arweave's **Permaweb** and operates without the need for trusted intermediaries.

## Try it out live on the [permaweb](https://dca_agent.arweave.dev)

For details on the DCA Agent capabilities and a technical deep-dive, please refer to our [research article](TODO_LINK).


## Run Locally

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
