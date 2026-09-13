import { init } from "https://esm.run/@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

export const TESTNET_RPC_CANDIDATES = [
  "https://rpc.nimiq-testnet.com",
  "https://rpc.pos.nimiq-testnet.com",
];

let resolvedTestnetRpc = null;
let providerPromise = null;

/**
 * Initialize Nimiq Pay provider
 */
export async function initNimiq(options = { timeout: 10000 }) {
  if (providerPromise) return providerPromise;

  providerPromise = (async () => {
    try {
      const provider = await init(options);
      if (!provider) throw new Error("Nimiq provider was not returned.");
      return provider;
    } catch (error) {
      console.error("Failed to initialize Nimiq provider:", error);
      throw new Error("Nimiq Pay provider not available. Open inside Nimiq Pay.");
    }
  })();

  try {
    return await providerPromise;
  } catch (error) {
    providerPromise = null;
    throw error;
  }
}

/**
 * Get primary connected account
 */
export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());
  const accounts = await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error("No Nimiq account connected.");
  }

  return cleanAddress(accounts[0]);
}

/**
 * Address formatting utilities
 */
export function cleanAddress(address) {
  return address ? String(address).replace(/\s+/g, "").toUpperCase() : "";
}

export function shortenAddress(address, leading = 4, trailing = 4) {
  const cleaned = cleanAddress(address);
  if (!cleaned || cleaned.length <= leading + trailing) return cleaned;
  return `${cleaned.slice(0, leading)}...${cleaned.slice(-trailing)}`;
}

/**
 * Unit conversions (Luna <-> NIM)
 */
export function nimToLuna(nim) {
  const numeric = Number(nim);
  return !Number.isFinite(numeric) || numeric < 0 ? 0 : Math.round(numeric * LUNA_PER_NIM);
}

export function lunaToNim(luna) {
  const numeric = Number(luna);
  return !Number.isFinite(numeric) || numeric < 0 ? 0 : numeric / LUNA_PER_NIM;
}

/**
 * Testnet JSON-RPC Request Handler
 */
async function testnetRpc(method, params = []) {
  const candidates = resolvedTestnetRpc ? [resolvedTestnetRpc] : TESTNET_RPC_CANDIDATES;
  let lastError = null;

  for (const endpoint of candidates) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: Date.now(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      if (result?.error) throw new Error(result.error.message);

      resolvedTestnetRpc = endpoint;
      const payload = result?.result;

      return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error("Could not reach any Nimiq Testnet RPC endpoint.", { cause: lastError });
}

/**
 * Fetch detailed balance from Testnet RPC
 */
export async function fetchNimiqBalanceDetailed(address) {
  if (!address) return { balance: 0, found: false };

  const formatted = cleanAddress(address);
  const account = await testnetRpc("getAccountByAddress", [formatted]);

  if (!account) return { balance: 0, found: false };

  const rawBalance = account.balance;
  if (rawBalance === undefined || rawBalance === null) return { balance: 0, found: true };

  return { balance: lunaToNim(rawBalance), found: true };
}

/**
 * Trigger NIM Payment inside Nimiq Pay
 */
export async function sendNIMTransaction(provider, { recipient, valueInNim, data }) {
  const nimiq = provider || (await initNimiq());
  const cleanRecipient = cleanAddress(recipient);

  if (!cleanRecipient.startsWith("NQ")) {
    throw new Error("Invalid recipient Nimiq address.");
  }

  const luna = nimToLuna(valueInNim);
  if (luna <= 0) throw new Error("Amount must be greater than 0 NIM.");

  if (data && data.trim()) {
    return await nimiq.sendBasicTransactionWithData({
      recipient: cleanRecipient,
      value: luna,
      data: data.trim(),
    });
  }

  return await nimiq.sendBasicTransaction({
    recipient: cleanRecipient,
    value: luna,
  });
}