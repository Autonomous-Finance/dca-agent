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


## TODO Requirements

Clarification needed on:
- Agent process state.
- Cron proxy processes state.
- Additional storage of peripheral information on Arweave.

## Development Plan

### Iterative Development

1. **Basic Life Cycle Management**:
 - Implement life cycle management, including initialization, access control, top-up, withdrawal, and retirement for the agent.
 - Track and manage multiple agents, including those transferred to new owners.

2. **Advanced DCA Agent**:
 - Implement full automation and display the state of the active agent.
 - Add performance metrics and enhance the user interface for better usability and aesthetics.

### User Experience Enhancements

- Improve the UI to be responsive and aesthetically pleasing.
- Implement convenient user interactions like maximum balance input and balance sliders.
- Enhance in-app messaging and logs for better user tracking.
- Display deployment progress visually and support pagination for process management.

## Technical Debt

- Address the retrieval and management of agent information, ensuring processes are handled optimally on the backend.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
