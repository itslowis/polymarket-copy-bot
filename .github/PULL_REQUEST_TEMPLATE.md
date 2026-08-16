<!--
Before opening: confirm this diff contains no private keys, API credentials,
or .env contents. Check `git diff main` if you are unsure.
-->

## What this changes

<!-- One or two sentences. Link the issue this closes, if any. -->

## Why

<!-- The problem being solved. If you are deleting something because it looks
unused, say how you verified that nothing depends on it. -->

## How it was tested

<!-- "It compiles" is not enough for anything touching trading behaviour.
Describe what you actually ran. -->

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Ran the bot against a **throwaway** wallet, if this affects runtime behaviour

## Risk

- [ ] This changes contract addresses, token approvals, trade sizing, order placement, or risk limits

<!-- If you checked the box above, explain the blast radius if this is wrong,
and how you validated it. These paths move real money. -->

## Checklist

- [ ] No secrets, keys, or `.env` contents in the diff, commits, or screenshots
- [ ] Scoped to one logical change, with no unrelated refactors or formatting churn
- [ ] Documentation and `.env.example` updated if configuration changed
