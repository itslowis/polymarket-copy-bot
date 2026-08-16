# Polymarket Copy Trading Bot

A TypeScript bot that watches a target Polymarket wallet and mirrors its `BUY` trades to your own account with configurable sizing and risk controls.

> **Disclaimer.** This software is provided as-is, for educational purposes. Copy trading carries significant financial risk and you can lose your entire balance. The past behaviour of a target wallet is no guarantee of future performance. You are solely responsible for any funds you put at risk and for complying with the laws and platform terms that apply to you.

## How It Works

1. **Monitors** a target wallet for new trades via REST polling, and optionally via WebSocket for lower latency.
2. **Filters** — only `BUY` trades are copied. `SELL` trades are detected and skipped.
3. **Sizes** the copy trade from either a multiplier of the original or a fixed amount, then clamps it between `MIN_TRADE_SIZE` and `MAX_TRADE_SIZE`.
4. **Risk checks** — optional session-level and per-market notional caps block trades that would exceed your limits.
5. **Executes** the order on Polymarket's CLOB as a `LIMIT` (GTC), `FOK`, or `FAK` order.

API credentials are derived automatically from your `PRIVATE_KEY` at startup and held in memory for the session only — there is no dashboard setup and nothing is written to disk.

## Prerequisites

- Node.js 20.10+ and npm (required by `@polymarket/clob-client-v2`)
- A Polygon EOA wallet funded with **pUSD** (trading collateral) and a small amount of **POL** for gas
- A Polygon RPC URL ([QuickNode](https://www.quicknode.com) recommended; the bot falls back to the public `https://polygon-rpc.com`)

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

See [Polymarket's docs](https://docs.polymarket.com) for the full example.

Once pUSD is in your wallet, the bot automatically approves all required exchange contracts on first run. You also need **~0.5 POL** for gas; the bot warns on startup if your POL balance drops below 0.05.

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
| `PRIVATE_KEY` | Your EOA private key, used to sign and submit orders |
| `RPC_URL` | Polygon JSON-RPC endpoint |

## Running

```bash
# Run directly from TypeScript
npm start

# Development (watch mode with hot reload)
npm run dev

# Compile then run
npm run build
npm run start:prod

# Typecheck without emitting
npm run typecheck
```

Stop the bot with `Ctrl+C`. It prints session statistics on shutdown.

## Configuration

All settings are environment variables. See [.env.example](.env.example) for a copy-paste template.

### Core

| Variable | Default | Description |
|---|---|---|
| `TARGET_WALLET` | — | Wallet address to follow (required) |
| `PRIVATE_KEY` | — | Your EOA private key (required) |
| `RPC_URL` | `https://polygon-rpc.com` | Polygon RPC endpoint |

### Trade Sizing

| Variable | Default | Description |
|---|---|---|
| `POSITION_SIZE_MODE` | `multiplier` | `multiplier` scales the target's size; `fixed` always trades `FIXED_POSITION_SIZE` |
| `POSITION_MULTIPLIER` | `0.1` | Fraction of the original trade size to copy (`0.1` = 10%), used in `multiplier` mode |
| `FIXED_POSITION_SIZE` | `5` | Trade size in pUSD, used in `fixed` mode |
| `MAX_TRADE_SIZE` | `100` | Upper clamp on the copy trade size, in pUSD |
| `MIN_TRADE_SIZE` | `1` | Lower clamp on the copy trade size, in pUSD |
| `SLIPPAGE_TOLERANCE` | `0.02` | Max price slippage as a decimal (`0.02` = 2%) |
| `ORDER_TYPE` | `FOK` | `LIMIT` (GTC), `FOK` (fill-or-kill), or `FAK` (fill-and-kill) |

`FOK` and `FAK` orders are subject to Polymarket's 1 pUSD market minimum, which overrides a lower `MIN_TRADE_SIZE`.

### Risk Controls

| Variable | Default | Description |
|---|---|---|
| `MAX_SESSION_NOTIONAL` | `0` | Max total pUSD spent per bot session (`0` = no cap) |
| `MAX_PER_MARKET_NOTIONAL` | `0` | Max total pUSD held per market (`0` = no cap) |

### Monitoring

| Variable | Default | Description |
|---|---|---|
| `POLL_INTERVAL` | `2000` | REST polling interval in milliseconds |
| `USE_WEBSOCKET` | `true` | Enable WebSocket for faster trade detection |
| `USE_USER_CHANNEL` | `false` | Use the authenticated user WS channel instead of the public market channel |
| `WS_ASSET_IDS` | — | Comma-separated token IDs to pre-subscribe to (market channel) |
| `WS_MARKET_IDS` | — | Comma-separated condition IDs to pre-subscribe to (user channel) |

### Gas

| Variable | Default | Description |
|---|---|---|
| `MIN_PRIORITY_FEE_GWEI` | `30` | Floor for the priority fee on approval transactions |
| `MIN_MAX_FEE_GWEI` | `60` | Floor for the max fee on approval transactions |

Polygon rejects transactions priced below its minimum, so these floors exist to keep approval transactions from getting stuck. Raise them if approvals are slow to confirm.

## Project Structure

| File | Responsibility |
|---|---|
| [src/index.ts](src/index.ts) | Orchestration, dedup, session stats, shutdown handling |
| [src/config.ts](src/config.ts) | Environment parsing and validation |
| [src/monitor.ts](src/monitor.ts) | REST polling of the Polymarket data API |
| [src/websocket-monitor.ts](src/websocket-monitor.ts) | WebSocket feed with auto-reconnect |
| [src/trader.ts](src/trader.ts) | Order construction, approvals, balance checks, retries |
| [src/positions.ts](src/positions.ts) | Position and average-price tracking |
| [src/risk-manager.ts](src/risk-manager.ts) | Notional cap enforcement |

## Notes

- The bot only copies trades that occur **after startup**. Earlier trades by the target wallet are ignored.
- REST polling stays active as a fallback even when WebSocket is enabled. Occasional WebSocket reconnects are normal.
- Duplicate trades are deduplicated by transaction hash where available, and otherwise by a trade fingerprint of token, side, size, price and timestamp.
- Existing open positions are reconciled at startup and counted toward the notional caps.
- Failed trades are not retried once the retry budget is exhausted; the bot logs the reason and moves on to the next trade.

## Security

- Never commit your `.env` file. Only `.env.example` is tracked.
- Use a **dedicated wallet** for the bot. Do not reuse a wallet holding other assets.
- Start with small `MAX_TRADE_SIZE` and `POSITION_MULTIPLIER` values and scale up only after validating behaviour.
- The bot grants unlimited (`MaxUint256`) pUSD allowances to the Polymarket exchange contracts on first run, which is what the protocol expects but is worth understanding before you fund the wallet.
- Approvals are granted to both the current and the legacy v1 exchange contracts. This is deliberate — the CLOB server reports which order version to use, and orders are signed against the v1 contracts when it reports version 1. See the comments in [src/config.ts](src/config.ts) before changing those addresses.

All contract addresses are verified against [Polymarket's published contract list](https://docs.polymarket.com/developers/contracts).

## License

[MIT](LICENSE)
