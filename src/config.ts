import dotenv from 'dotenv';

dotenv.config();

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export const config = {
  targetWallet: process.env.TARGET_WALLET || '',
  privateKey: process.env.PRIVATE_KEY || '',
  rpcUrl: process.env.RPC_URL || 'https://polygon-rpc.com',

  // Polygon mainnet contracts used for approvals and balance checks.
  // Verified against https://docs.polymarket.com/developers/contracts.
  contracts: {
    // Current exchanges, per the docs above.
    exchange: '0xE111180000d2663C0091e4f400237545B87B996B',
    negRiskExchange: '0xe2222d279d744050d28e00520010520000310F59',

    // v3 exchange, listed in the docs as the Combos "Exchange (proxy)".
    // clob-client-v2 1.1.0 added `case 3` to its order routing and sends every
    // v3 order here, with no separate neg-risk variant. Approved for the same
    // reason as v1 below: the server chooses the version, not us.
    exchangeV3: '0xe3333700cA9d93003F00f0F71f8515005F6c00Aa',

    // Legacy v1 exchanges. These are NOT listed in Polymarket's public contract
    // docs, but do not delete them: clob-client-v2 picks its exchange from the
    // order version the CLOB server reports at `GET /version`, and signs against
    // these addresses whenever that version is 1. The client force-refreshes the
    // version and retries on an ORDER_VERSION_MISMATCH error, so the switch can
    // happen mid-session. Approving only the v2 pair would break trading the
    // moment the server fell back to v1.
    exchangeV1: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
    negRiskExchangeV1: '0xC5d563A36AE78145C45a50134d48A1215220f80a',

    // Conditional Tokens (CTF)
    ctf: '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045',
    // pUSD CollateralToken proxy. Polymarket's collateral token, not USDC.e.
    pusd: '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB',
  },

  trading: {
    positionSizeMode: (process.env.POSITION_SIZE_MODE || 'multiplier') as 'multiplier' | 'fixed',
    positionSizeMultiplier: parseFloat(process.env.POSITION_MULTIPLIER || '0.1'),
    fixedPositionSize: parseFloat(process.env.FIXED_POSITION_SIZE || '5'),
    maxTradeSize: parseFloat(process.env.MAX_TRADE_SIZE || '100'),
    minTradeSize: parseFloat(process.env.MIN_TRADE_SIZE || '1'),
    slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.02'),
    // LIMIT=GTC, FOK=fill-or-kill, FAK=fill-and-kill
    orderType: (process.env.ORDER_TYPE || 'FOK') as 'LIMIT' | 'FOK' | 'FAK',
  },

  risk: {
    maxSessionNotional: parseFloat(process.env.MAX_SESSION_NOTIONAL || '0'),
    maxPerMarketNotional: parseFloat(process.env.MAX_PER_MARKET_NOTIONAL || '0'),
  },

  monitoring: {
    pollInterval: parseInt(process.env.POLL_INTERVAL || '2000'),
    useWebSocket: process.env.USE_WEBSOCKET !== 'false',
    useUserChannel: process.env.USE_USER_CHANNEL === 'true',
    wsAssetIds: parseCsv(process.env.WS_ASSET_IDS),
    wsMarketIds: parseCsv(process.env.WS_MARKET_IDS),
  },

  // Floors for approval txs, since Polygon rejects transactions priced too low.
  gas: {
    minPriorityFeeGwei: parseFloat(process.env.MIN_PRIORITY_FEE_GWEI || '30'),
    minMaxFeeGwei: parseFloat(process.env.MIN_MAX_FEE_GWEI || '60'),
  },
};

export function validateConfig(): void {
  if (!config.targetWallet) {
    throw new Error('Missing required config: TARGET_WALLET');
  }
  if (!config.privateKey) {
    throw new Error('Missing required config: PRIVATE_KEY');
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(config.targetWallet)) {
    throw new Error(`Invalid TARGET_WALLET: expected a 0x-prefixed 40-character address`);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(config.privateKey)) {
    throw new Error('Invalid PRIVATE_KEY: expected a 0x-prefixed 64-character hex key');
  }

  const { positionSizeMode, maxTradeSize, minTradeSize, orderType } = config.trading;

  if (positionSizeMode !== 'multiplier' && positionSizeMode !== 'fixed') {
    throw new Error(`Invalid POSITION_SIZE_MODE: ${positionSizeMode} (expected 'multiplier' or 'fixed')`);
  }
  if (orderType !== 'LIMIT' && orderType !== 'FOK' && orderType !== 'FAK') {
    throw new Error(`Invalid ORDER_TYPE: ${orderType} (expected 'LIMIT', 'FOK' or 'FAK')`);
  }
  if (!(maxTradeSize > 0)) {
    throw new Error(`Invalid MAX_TRADE_SIZE: ${maxTradeSize} (must be greater than 0)`);
  }
  if (minTradeSize > maxTradeSize) {
    throw new Error(`MIN_TRADE_SIZE (${minTradeSize}) cannot exceed MAX_TRADE_SIZE (${maxTradeSize})`);
  }

  console.log('✅ Configuration validated');
  console.log('   Auth: EOA (signature type 0), API credentials derived from PRIVATE_KEY at startup');
}
