# Contributing

Thanks for your interest in improving this project. This document explains how to propose a change and what will be checked before it can be merged.

## Ground rules

- **Never include secrets in a contribution.** No private keys, seed phrases, API credentials, or the contents of your `.env`. This applies to code, tests, issues, pull requests, screenshots, and log output. See [SECURITY.md](SECURITY.md).
- **Never test against a funded wallet.** Use a throwaway wallet with a trivial balance.
- All changes reach `main` through a pull request. Direct pushes are blocked, and every pull request needs review and approval from the maintainer before merging.

## Getting set up

```bash
git clone https://github.com/itslowis/polymarket-copy-bot.git
cd polymarket-copy-bot
npm install
cp .env.example .env    # fill in a throwaway wallet
```

## Before you open a pull request

Run both of these locally. CI runs the same checks and a pull request cannot merge until they pass.

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc
```

The project builds under TypeScript `strict` with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` and `exactOptionalPropertyTypes` enabled. Unused variables are build errors, not warnings.

## Making a change

1. Fork the repository and branch from `main`. Use a descriptive branch name (`fix/websocket-reconnect-leak`, not `patch-1`).
2. Keep the pull request focused. One logical change per pull request; unrelated refactors and formatting churn make review slower and get sent back.
3. Match the surrounding code. No new dependencies, formatters, or lint configs without discussing it in an issue first.
4. Explain *why* in the commit message, not just *what*. If you are removing something because it looks unused, say how you verified that.
5. Fill in the pull request template, including the testing section.

## Areas that need extra care

Some parts of this codebase move real money. Changes here get closer scrutiny, and a pull request that touches them without explanation will be sent back.

| Area | Why it is sensitive |
|---|---|
| [src/config.ts](src/config.ts) contract addresses | A wrong address sends funds or approvals to the wrong contract. Addresses are verified against Polymarket's published contract list. The legacy v1 exchange entries look unused but are load-bearing — read the comments before touching them. |
| [src/trader.ts](src/trader.ts) approvals and sizing | Grants unlimited token allowances and determines how much money each trade risks. |
| [src/risk-manager.ts](src/risk-manager.ts) | The only thing enforcing the notional caps users rely on. |
| Anything reading `PRIVATE_KEY` | The key must never be logged, written to disk, or sent anywhere except the signing path. |

If your change alters trade sizing, order placement, or approval behaviour, describe how you validated it. "It compiles" is not validation for these.

## Reporting bugs

Open an issue using the bug report template. A useful report includes the config you ran with (**with secrets removed**), what you expected, what happened, and relevant log output.

For anything with security impact, do not open a public issue — follow [SECURITY.md](SECURITY.md).

## A note on scope

This is a copy-trading bot for a live prediction market. Pull requests that add features encouraging riskier automated trading, remove safety limits, or obscure what the bot is doing with a user's funds may be declined even if the code is sound.
