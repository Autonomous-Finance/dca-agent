# Autonomous DCA Agent on AO

> **⚠️ ARCHIVED PROJECT - NO LONGER MAINTAINED**
> 
> This project was initially developed by **Autonomous Finance (AF)** and is now archived. It will **not be maintained** going forward. This repository is preserved as open-source for educational and reference purposes only.
> 
> **Use at your own risk.** See the [Disclaimer](#disclaimer) section below for important information.

## 🚨 Project Status: Discontinued & Archived

This project was initially developed by **Autonomous Finance (AF)** as early work demonstrating the capabilities of the AO ecosystem. The project has been discontinued and is now archived. This repository is maintained as a public good for educational purposes.

**This project is no longer maintained** - no bug fixes, security updates, or feature additions will be provided. Use at your own risk.

Feel free to explore the code in this repo or read our related [research article](https://www.autonomous.finance/research/dca-agent).

An alternative to DCA on AO is currently available on [Botega](https://botega.arweave.net/).

---

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
- **Composability**: Designed to be owned/controlled by a user possessing an Arweave wallet or by another automated agent.

## Operations

- **Token Loading**: Supports loading with QuoteToken.
- **Withdrawals**: Permits the withdrawal of either Base or QuoteToken.
- **Liquidation**: Allows complete liquidation, returning assets in QuoteToken.

## Configuration
- **Initial Setup**: BaseToken, slippage, and swapAmount are set during initialization.
- **Fixed BaseToken**: The BaseToken configuration is static and cannot be changed after initialization.

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
1. the main agent process is created as a cron process and signed with the user's wallet.
2. Loading of `process.lua` upon deployment confirmation.
3. Initialization of the agent with its configuration and proper owner
4. Start Monitoring the agent as a cron process
5. Registration of the agent with the DCA backend process on AO

## Security Considerations

⚠️ **Important Security Notes:**

- This project is **archived and unmaintained** - no security patches will be provided
- Always review code before deploying to production environments
- Never commit sensitive credentials or private keys to version control
- Environment variables (`DEPLOY_KEY`, `ANT_CONTRACT`) should be kept secure and never exposed
- The deployment script (`scripts/permaweb-deploy.mjs`) requires sensitive credentials - ensure proper access controls
- This codebase interacts with blockchain networks and handles financial transactions - use extreme caution

For more detailed security information, see [SECURITY.md](SECURITY.md).

### Environment Variables

The following environment variables are used in deployment scripts:
- `DEPLOY_KEY`: Base64-encoded Arweave wallet JSON (keep secure!)
- `ANT_CONTRACT`: ARNS ANT contract address

**Never commit these values to the repository.** Use environment variables or secure secret management.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

⚠️ **This project is archived and not accepting contributions.** This repository is preserved for reference purposes only.



## Disclaimer

### Important Notice

This software, the Autonomous Investment Agent (AIA), is provided as open-source under the MIT License. While the software has been developed with diligence and care, it is important to understand that its use comes with inherent risks. The technology behind this agent and the AO ecosystem is relatively new and may be subject to unknown vulnerabilities, rapid changes, and evolving standards.

## Use at Your Own Risk

1. **No Warranties**: The AIA software is provided "as is", without any warranties of any kind. This includes, but is not limited to, warranties of merchantability, fitness for a particular purpose, and non-infringement. By using this software, you acknowledge that you do so at your own risk.

2. **Financial Risk**: The AIA employs an autonomous investment strategy. As with any investment, there are financial risks involved, including but not limited to market volatility, loss of investment, and unforeseen changes in the blockchain ecosystem. You are solely responsible for any financial decisions made using this software.

3. **Technological Risk**: Blockchain technology, smart contracts, and decentralized finance (DeFi) protocols are complex and still developing. This software may have bugs, experience failures, or encounter security vulnerabilities that could result in unintended behavior, including financial losses.

4. **Regulatory Risk**: The regulatory environment for blockchain technology and digital assets is uncertain and rapidly evolving. It is your responsibility to ensure compliance with any applicable laws and regulations in your jurisdiction.

5. **No Liability**: In no event shall the authors, developers, or contributors of this software be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

## User Responsibility

- **Due Diligence**: Users are encouraged to conduct their own due diligence before engaging in any transactions or relying on the functionality of this software.
- **Education**: Ensure you have a solid understanding of blockchain technology, the AO ecosystem, and decentralized finance principles before using the AIA software.
- **Security Practices**: Follow best practices for security, such as safeguarding private keys, using secure devices, and regularly updating software.

By using this software, you agree to this disclaimer and acknowledge that you understand and accept the risks involved.


## Architecture

### Components

- **Agent Process**: Lua-based autonomous agent running on AO that executes DCA swaps
- **Backend Process**: Manages agent registration and status tracking
- **Frontend**: Next.js application deployed on Arweave Permaweb for agent management
- **Lua Scripts**: Core agent logic organized into modular components (balances, swaps, withdrawals, etc.)

### Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, Material-UI
- **Blockchain**: AO Protocol, Arweave
- **Agent Logic**: Lua scripts running on AO processes
- **Deployment**: Permaweb (Arweave), Irys SDK

## Development Notes

### Build Process

The Lua agent and backend scripts are combined using Amalg before deployment:
- Agent scripts: `ao/agent/*.lua` → `ao/build/output-agent.lua`
- Backend scripts: `ao/backend/*.lua` → `ao/build/output-backend.lua`

### Known Limitations

- BaseToken configuration is fixed after initialization
- Single currency pair per agent
- No automatic updates or maintenance

## Historical TODO (Unimplemented)

The following items were planned but never implemented (project is archived):
- Update backend to latest AO SDK
- Update AO module to use when spawning
- Refactor agent to use request-response mechanism

