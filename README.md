# AgentDrop 

**AI-powered batch NFT minting agent built on Base using MetaMask Flask, Venice AI, and Pinata IPFS.**

> Built for the MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook Off — powered by HackQuest

-----

## What is AgentDrop?

AgentDrop lets you describe an NFT theme, input recipient wallet addresses, and mint unique AI-generated NFTs to all of them in a single batch transaction on Base Sepolia. Venice AI generates the artwork, Pinata pins it to IPFS, and wagmi handles on-chain minting via a custom `batchMint` smart contract.

-----

## Features

-  **AI Art Generation** — Venice AI (`flux-2-max`) generates unique artwork per recipient based on a shared theme
-  **Batch Minting** — Single `batchMint()` transaction mints to all recipients at once
-  **Base Sepolia** — Deployed on Base L2 for low gas fees
-  **IPFS Storage** — Images and metadata pinned via Pinata
- **MetaMask Flask** — injected connector for developer wallet support

-----

## Tech Stack

|Layer            |Technology                         |
|-----------------|-----------------------------------|
|Frontend         |React + TypeScript + Vite          |
|Smart Contract   |Solidity 0.8.0, Hardhat            |
|Chain Interaction|wagmi + viem                       |
|Wallet           |MetaMask Flask (injected connector)|
|AI Art           |Venice AI (flux-2-max model)       |
|Storage          |Pinata IPFS                        |
|Network          |Base Sepolia (chainId: 84532)      |
|API Server       |Vercel Serverless Functions        |

-----

## Smart Accounts Kit Usage

AgentDrop uses wagmi’s `useConnect`, `useWriteContract`, and `useSwitchChain` hooks to interact with MetaMask Flask and execute smart contract transactions on Base Sepolia.

- **Wallet connection via MetaMask Flask injected connector:**
  [`src/App.tsx#L1-L4`](https://github.com/LrdSantan/agentdrop/blob/main/src/App.tsx#L1-L4)
- **Chain switching to Base Sepolia before minting:**
  [`src/App.tsx#L114`](https://github.com/LrdSantan/agentdrop/blob/main/src/App.tsx#L114)
- **`writeContractAsync` calling `batchMint` on-chain:**
  [`src/App.tsx#L117-L125`](https://github.com/LrdSantan/agentdrop/blob/main/src/App.tsx#L117-L125)

> Note: Advanced Permissions (ERC-7715) and Delegations were scoped for this build. The core minting flow uses MetaMask Flask’s injected provider with wagmi for smart contract interaction.

-----

## Venice AI Usage

Venice AI is used to generate unique AI artwork per NFT recipient. Each image is generated using the `flux-2-max` model with a theme + recipient-specific prompt.

**Server-side proxy (Vercel serverless function):**
[`api/venice.ts`](https://github.com/LrdSantan/agentdrop/blob/main/api/venice.ts) — forwards requests to `https://api.venice.ai/api/v1/image/generate`

**Client-side Venice AI call:**
[`src/App.tsx#L71-L83`](https://github.com/LrdSantan/agentdrop/blob/main/src/App.tsx#L71-L83)

Each image is:

1. Generated as base64 via Venice AI (`flux-2-max`)
1. Converted to a blob and pinned to IPFS via Pinata — [`src/App.tsx#L50-L64`](https://github.com/LrdSantan/agentdrop/blob/main/src/App.tsx#L50-L64)
1. Metadata JSON created and also pinned to IPFS
1. IPFS URI passed to `batchMint`

-----

## Smart Contract

**Contract:** `AgentDrop.sol`
**Key function:** `batchMint(address[] recipients, string[] uris)` — mints unique NFTs to all recipients in one transaction
**Network:** Base Sepolia (chainId: 84532)
**Deployer:** `0xCa60CdDe6Bc96E5FA3082e6EA89E0F745aC1740e`

-----

## Local Setup

### Prerequisites

- Node.js 18+
- MetaMask Flask installed in browser
- Base Sepolia ETH (bridge via [Across.to](https://across.to) or request from [Base Discord](https://discord.gg/buildonbase))

### Installation

```bash
git clone https://github.com/LrdSantan/agentdrop
cd agentdrop
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_VENICE_API_KEY=your_venice_ai_key
VITE_PINATA_JWT=your_pinata_jwt
VENICE_API_KEY=your_venice_ai_key
```

### Run Development Server

```bash
npm run dev
```

### Deploy Smart Contract

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network base-sepolia
```

-----

## How It Works

1. User connects MetaMask Flask wallet via injected connector
1. User enters an NFT theme and a list of recipient wallet addresses
1. For each address, Venice AI generates unique artwork via the serverless proxy (`api/venice.ts`)
1. Each image is pinned to IPFS via Pinata; metadata JSON is created and also pinned
1. App switches to Base Sepolia and calls `batchMint()` with all addresses + IPFS URIs
1. NFTs appear in each recipient’s wallet on Base

-----

## Social Media

Follow the builder on X: [@ifwayodeji](https://x.com/ifwayodeji)

-----

## Built By

**Deji** — Full stack  Engineer & Founder of [Tixora](https://tixoraafrica.com.ng)
GitHub: [LrdSantan](https://github.com/LrdSantan)

-----

## License

MIT