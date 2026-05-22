# Polymarket Copy Trading Bot

A TypeScript bot that watches a target Polymarket wallet and mirrors its `BUY` trades to your own account with configurable sizing and risk controls.

## How It Works

1. **Monitors** a target wallet for new trades via REST polling (and optionally WebSocket for lower latency).
2. **Filters** — only `BUY` trades are copied; `SELL` trades are skipped.
3. **Sizes** the copy trade using `POSITION_MULTIPLIER` and clamps it between `MIN_TRADE_SIZE` and `MAX_TRADE_SIZE`.
4. **Risk checks** — optional session-level and per-market notional caps block trades that would exceed your limits.
5. **Executes** the order on Polymarket's CLOB as a `LIMIT` (GTC), `FOK`, or `FAK` order.

API credentials are derived automatically from your `PRIVATE_KEY` at startup — no dashboard setup needed.

## Prerequisites

- Node.js 18+ and npm
- A Polygon EOA wallet funded with **pUSD** (trading collateral) and a small amount of **POL** for gas
- A Polygon RPC URL ([QuickNode](https://www.quicknode.com) recommended)

## Funding Your Wallet

Polymarket uses **pUSD** — a USDC-backed ERC-20 on Polygon — as its collateral token. You need pUSD in your EOA wallet before the bot can place trades.

**Option 1 — Polymarket UI (simplest)**

Deposit at [polymarket.com](https://polymarket.com). The UI accepts POL, USDC, or other assets and delivers pUSD to your connected wallet.

**Option 2 — Wrap USDC.e manually**

Call `wrap()` on the CollateralOnramp contract (`0x93070a847efEf7F70739046A929D47a521F5B8ee`):

```ts
// 1. Approve the Onramp to spend your USDC.e
// 2. Call wrap(USDCE_ADDRESS, your_wallet, amount)
```

See [Polymarket's pUSD docs](https://docs.polymarket.com) for the full example.

Once pUSD is in your wallet, the bot automatically approves all required exchange contracts on first run.

You also need **~0.5 POL** for gas. The bot will warn you on startup if your POL balance drops below 0.05.

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

**3. Fill in the required values**

| Variable | Description |
|---|---|
| `TARGET_WALLET` | The Polymarket wallet address to copy |
| `PRIVATE_KEY` | Your EOA private key (used to sign and submit orders) |
| `RPC_URL` | Polygon JSON-RPC endpoint |

**4. (Optional) Preview your generated API credentials**

```bash
npm run generate-api-creds
```

## Running

```bash
# Production
npm start

# Development (watch mode with hot reload)
npm run dev

# Compile then run
npm run build
npm run start:prod
```

## Configuration

All settings are controlled via environment variables. See `.env.example` for the full list.

### Core

| Variable | Default | Description |
|---|---|---|
| `TARGET_WALLET` | — | Wallet address to follow |
| `PRIVATE_KEY` | — | Your EOA private key |
| `RPC_URL` | `https://polygon-rpc.com` | Polygon RPC endpoint |

### Trade Sizing

| Variable | Default | Description |
|---|---|---|
| `POSITION_MULTIPLIER` | `0.1` | Fraction of the original trade size to copy (e.g. `0.1` = 10%) |
| `MAX_TRADE_SIZE` | `100` | Maximum copy trade size in pUSD |
| `MIN_TRADE_SIZE` | `1` | Minimum copy trade size in pUSD |
| `SLIPPAGE_TOLERANCE` | `0.02` | Max price slippage as a decimal (e.g. `0.02` = 2%) |
| `ORDER_TYPE` | `FOK` | Order type: `LIMIT` (GTC), `FOK` (fill-or-kill), or `FAK` (fill-and-kill) |

### Risk Controls

| Variable | Default | Description |
|---|---|---|
| `MAX_SESSION_NOTIONAL` | `0` | Max total pUSD spent per bot session (`0` = no cap) |
| `MAX_PER_MARKET_NOTIONAL` | `0` | Max total pUSD spent per market (`0` = no cap) |

### Monitoring

| Variable | Default | Description |
|---|---|---|
| `POLL_INTERVAL` | `2000` | REST polling interval in milliseconds |
| `USE_WEBSOCKET` | `true` | Enable WebSocket for faster trade detection |
| `USE_USER_CHANNEL` | `false` | Use the authenticated user WS channel (requires valid API creds) |
| `WS_ASSET_IDS` | — | Comma-separated token IDs to subscribe to via WebSocket |
| `WS_MARKET_IDS` | — | Comma-separated market condition IDs (user channel only) |

## Notes

- The bot only copies trades that occur **after startup**. Any trades made by the target wallet before you start are ignored.
- REST polling is always active as a fallback, even when WebSocket is enabled. Frequent WebSocket reconnects are normal.
- Duplicate trades (detected by tx hash or trade fingerprint) are automatically deduplicated.
- Existing open positions are reconciled at startup and counted toward per-market notional caps.

## Security

- Never commit your `.env` file.
- Use a **dedicated wallet** for bot trading — do not reuse a wallet that holds other assets.
- Start with small `MAX_TRADE_SIZE` and `POSITION_MULTIPLIER` values and scale up only after validating behavior.
- Copy trading carries significant financial risk. Past behavior of a target wallet is no guarantee of future performance.
