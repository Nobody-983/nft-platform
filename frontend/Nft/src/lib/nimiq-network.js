/**
 * Nimiq NFT is testnet-only.
 *
 * @nimiq/core defaults to MainAlbatross and the mainnet seed list
 * (aurora.seed.nimiq.com, catalyst.seed.nimiq.network, …).
 * Those seeds are the mainnet gateways. They are never used here.
 */
export const NIMIQ_NETWORK_ID = "testalbatross";
export const NIMIQ_NETWORK_LABEL = "Nimiq Testnet";
export const NIMIQ_CONSENSUS = "TestAlbatross";
export const NIMIQ_CURRENCY = "NIM";

export const TESTNET_SEED_NODES = Object.freeze([
  "/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss",
  "/dns4/seed2.pos.nimiq-testnet.com/tcp/8443/wss",
  "/dns4/seed3.pos.nimiq-testnet.com/tcp/8443/wss",
  "/dns4/seed4.pos.nimiq-testnet.com/tcp/8443/wss",
]);

export const TESTNET_FAUCET_URL = "https://faucet.pos.nimiq-testnet.com";
export const TESTNET_EXPLORER_URL = "https://testnet.nimiqwatch.com";
export const TESTNET_WALLET_URL = "https://wallet.pos.nimiq-testnet.com";

export const PAY_TESTNET_HINT =
  "This app is Nimiq Testnet only. In Nimiq Pay, long-press Settings for 10 seconds, then switch the network to Testnet before connecting or sending.";

export function getTestnetExplorerTxUrl(hash) {
  if (!hash) {
    return TESTNET_EXPLORER_URL;
  }

  return `${TESTNET_EXPLORER_URL}/tx/${encodeURIComponent(hash)}`;
}
