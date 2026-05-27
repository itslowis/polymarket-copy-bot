import dotenv from 'dotenv';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon } from 'viem/chains';
import { ClobClient, Chain } from '@polymarket/clob-client-v2';

dotenv.config();

const HOST = 'https://clob.polymarket.com';

async function main(): Promise<void> {
  const privateKey = process.env.PRIVATE_KEY;
  const apiKey = process.env.POLYMARKET_USER_API_KEY || process.env.POLYMARKET_API_KEY;
  const secret = process.env.POLYMARKET_USER_SECRET || process.env.POLYMARKET_SECRET;
  const passphrase = process.env.POLYMARKET_USER_PASSPHRASE || process.env.POLYMARKET_PASSPHRASE;

  if (!privateKey) {
    throw new Error('Missing PRIVATE_KEY in .env');
  }
  if (!apiKey || !secret || !passphrase) {
    throw new Error('Missing POLYMARKET_USER_API_KEY / POLYMARKET_USER_SECRET / POLYMARKET_USER_PASSPHRASE in .env');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const signer = createWalletClient({ account, chain: polygon, transport: http() });

  const client = new ClobClient({
    host: HOST,
    chain: Chain.POLYGON,
    signer,
    creds: { key: apiKey, secret, passphrase },
    funderAddress: account.address,
  });

  const result: any = await client.getApiKeys();
  if (result?.error || result?.status >= 400) {
    throw new Error(result?.error || `API returned status ${result?.status}`);
  }

  console.log('✅ Static API credentials are valid for this signer');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('❌ API credential validation failed:', error.message || error);
  const msg = String(error?.message || '').toLowerCase();
  if (msg.includes('unauthorized/invalid api key')) {
    console.error('   Hint: Builder dashboard keys are not user trading credentials.');
    console.error('   Generate user credentials from PRIVATE_KEY with: npm run generate-api-creds');
  }
  process.exit(1);
});
