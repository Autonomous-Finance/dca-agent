# Autonomous DCA Agent on AO

<img src="logo.webp" width="150" height="150" alt="DCA Agent Logo">

This Autonomous Investment Agent (AIA) executes a dynamic dollar-cost-average (DCA) investment strategy across various liquidity pools within the AO ecosystem. It **automatically buys** a base token at predetermined, user-configurable intervals using a consistent amount of a quote token for each transaction.

The agent has **functional autonomy** and operates independently on the AO platform, requiring no off-chain signals or human intervention.

The management interface is hosted on Arweave's **Permaweb**, ensuring operation without the need for trusted intermediaries.

## Try It Out Live

Experience the DCA Agent live on the [permaweb](https://dca_agent.arweave.dev).

For more details on capabilities and a technical deep-dive, refer to our [Research Article](https://www.autonomous.finance/research/dca-agent).

## Run Locally

To run the development server:

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
```

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





