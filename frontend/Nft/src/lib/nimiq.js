import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

export const TESTNET_RPC_CANDIDATES = [
  "https://rpc.nimiq-testnet.com",
  "https://rpc.pos.nimiq-testnet.com",
];

export const TESTNET_RPC = TESTNET_RPC_CANDIDATES[0];

let resolvedTestnetRpc = null;
let providerPromise = null;

export async function initNimiq(options = { timeout: 10_000 }) {
  if (providerPromise) return providerPromise;

  providerPromise = (async () => {
    try {
      const provider = await init(options);
      if (!provider) throw new Error("Nimiq provider was not returned.");
      return provider;
    } catch (error) {
      console.error("Failed to initialize Nimiq provider:", error);
      throw new Error("Nimiq Pay provider is not available.", { cause: error });
    }
  })();

  try {
    return await providerPromise;
  } catch (error) {
    providerPromise = null;
    throw error;
  }
}

// EXPORT 1: clearNimiqProvider
export function clearNimiqProvider() {
  providerPromise = null;
}

export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());
  const accounts = await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error("No Nimiq wallet account is connected.");
  }

  return cleanAddress(accounts[0]);
}

export function cleanAddress(address) {
  if (!address) return "";
  return String(address).replace(/\s+/g, "").toUpperCase();
}

// EXPORT 2: formatNimiqAddress
export function formatNimiqAddress(address) {
  const cleaned = cleanAddress(address);
  if (!cleaned) return "";
  const parts = cleaned.match(/.{1,4}/g);
  return parts ? parts.join(" ") : cleaned;
}

export function shortenAddress(address, leadingChars = 4, trailingChars = 4) {
  const cleaned = cleanAddress(address);
  if (!cleaned) return "";
  if (cleaned.length <= leadingChars + trailingChars) return cleaned;
  return `${cleaned.slice(0, leadingChars)}...${cleaned.slice(-trailingChars)}`;
}

export function nimToLuna(nim) {
  const numeric = Number(nim);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * LUNA_PER_NIM);
}

export function lunaToNim(luna) {
  const numeric = Number(luna);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric / LUNA_PER_NIM;
}

async function testnetRpc(method, params = []) {
  const candidates = resolvedTestnetRpc
    ? [resolvedTestnetRpc]
    : TESTNET_RPC_CANDIDATES;

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

      if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error("Could not reach Nimiq Testnet RPC endpoint.", { cause: lastError });
}

export async function fetchNimiqBalanceDetailed(address) {
  if (!address) return { balance: 0, found: false };
  const account = await testnetRpc("getAccountByAddress", [cleanAddress(address)]).catch(() => null);

  if (!account) return { balance: 0, found: false };
  const rawBalance = account.balance;
  if (rawBalance === undefined || rawBalance === null) return { balance: 0, found: true };

  return { balance: lunaToNim(rawBalance), found: true };
}

// EXPORT 3: fetchNimiqBalance
export async function fetchNimiqBalance(address) {
  const { balance } = await fetchNimiqBalanceDetailed(address);
  return balance;
}

// EXPORT 4: getConsensusStatus
export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());
  return Boolean(await nimiq.isConsensusEstablished());
}

// EXPORT 5: getBlockHeight
export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());
  return await nimiq.getBlockNumber();
}

export async function sendNIMTransaction(provider, { recipient, valueInNim, data }) {
  const nimiq = provider || (await initNimiq());
  const cleanRecipient = cleanAddress(recipient);

  if (!cleanRecipient || !cleanRecipient.startsWith("NQ")) {
    throw new Error("Invalid recipient Nimiq address.");
  }

  const luna = nimToLuna(valueInNim);
  if (luna <= 0) throw new Error("Transaction amount must be greater than 0 NIM.");

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