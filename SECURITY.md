# Security Policy

This project signs blockchain transactions with a private key and places real orders with real money. Please treat security reports here seriously.

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Report it privately through GitHub's [private vulnerability reporting](https://github.com/itslowis/polymarket-copy-bot/security/advisories/new). If that is unavailable, contact the maintainer through their GitHub profile and ask for a private channel before sharing details.

Please include what an attacker can achieve, the steps to reproduce it, and the affected version or commit. There is no bug bounty for this project.

You will get an initial response as quickly as the maintainer reasonably can, though this is a spare-time project — please do not read silence as dismissal. Please give a reasonable window for a fix before disclosing publicly.

### In scope

- Anything causing `PRIVATE_KEY` to be logged, written to disk, or transmitted anywhere other than the local signing path
- Trades executed that the configured risk limits should have blocked
- Token approvals granted to a contract other than the intended Polymarket contracts
- Dependency or supply-chain issues with a concrete exploit path in this codebase

### Out of scope

- Losing money because the wallet you copied made bad trades. That is the documented purpose of the software, not a vulnerability.
- Polymarket's own contracts and API. Report those to [Polymarket's bug bounty](https://cantina.xyz/bounties/ff945ca2-2a6e-4b83-b1b6-7a0cd3b94bea).
- Vulnerabilities requiring an attacker who already has your private key or shell access to your machine.

## If you leaked a private key

Move the funds to a new wallet immediately. Do not try to "unleak" it — a key that touched a public repository, an issue, a screenshot, or a log paste must be treated as compromised forever, even after the commit is deleted. Rotate first, clean up afterwards.

## Guidance for users

- Use a **dedicated wallet** holding only what you are willing to lose. Never reuse a wallet with other assets.
- This bot grants **unlimited (`MaxUint256`) pUSD allowances** to the Polymarket exchange contracts on first run. That is what the protocol expects, but it means those contracts can move your pUSD without further approval. Understand this before funding the wallet.
- The `.env` file is gitignored, but verify with `git status` before committing. Only `.env.example` should ever be tracked.
- Credentials derived from your private key at startup are held in memory for the session only and are never written to disk.
- Review the code before running it with real money. This is unaudited software provided without warranty, as stated in the [LICENSE](LICENSE).
