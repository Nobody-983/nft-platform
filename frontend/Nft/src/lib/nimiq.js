import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100; // 0.001 NIM

export const TESTNET_RPC_CANDIDATES = [
  "https://rpc.nimiq-testnet.com",
  "https://rpc.pos.nimiq-testnet.com",
];

export const TESTNET_RPC = TESTNET_RPC_CANDIDATES[0];

let resolvedTestnetRpc = null;
let providerPromise = null;

/**
 * Initialize the Nimiq Pay provider.
 */
export async function initNimiq(options = { timeout: 10_000 }) {
  if (providerPromise) {
    return providerPromise;
  }

  providerPromise = (async () => {
    try {
      const provider = await init(options);

      if (!provider) {
        throw new Error("Nimiq provider was not returned.");
      }

      return provider;
    } catch (error) {
      console.error("Failed to initialize Nimiq provider:", error);

      throw new Error(
        "Nimiq Pay provider is not available. Open this app inside Nimiq Pay.",
        { cause: error }
      );
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
 * Clear cached provider instance.
 */
export function clearNimiqProvider() {
  providerPromise = null;
}

/**
 * Get the primary connected Nimiq address.
 */
export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());
  const accounts = await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error("No Nimiq wallet account is connected.");
  }

  return cleanAddress(accounts[0]);
}

/**
 * Get all connected Nimiq addresses.
 */
export async function getNimiqAccounts(provider) {
  const nimiq = provider || (await initNimiq());
  const accounts = await nimiq.listAccounts();

  return (accounts || []).map(cleanAddress);
}

/**
 * Strip whitespace and normalize address casing.
 */
export function cleanAddress(address) {
  if (!address) return "";
  return String(address).replace(/\s+/g, "").toUpperCase();
}

/**
 * Format address into standard 4-character groups (e.g. NQ07 0000 0000...).
 */
export function formatNimiqAddress(address) {
  const cleaned = cleanAddress(address);
  if (!cleaned) return "";

  const parts = cleaned.match(/.{1,4}/g);
  return parts ? parts.join(" ") : cleaned;
}

/**
 * Shorten address for UI display.
 */
export function shortenAddress(address, leadingChars = 4, trailingChars = 4) {
  const cleaned = cleanAddress(address);
  if (!cleaned) return "";

  if (cleaned.length <= leadingChars + trailingChars) {
    return cleaned;
  }

  return `${cleaned.slice(0, leadingChars)}...${cleaned.slice(-trailingChars)}`;
}

/**
 * Convert NIM to Luna (1 NIM = 100,000 Luna).
 */
export function nimToLuna(nim) {
  const numeric = Number(nim);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.round(numeric * LUNA_PER_NIM);
}

/**
 * Convert Luna to NIM.
 */
export function lunaToNim(luna) {
  const numeric = Number(luna);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return numeric / LUNA_PER_NIM;
}

/**
 * Get maximum sendable NIM after reserving standard transaction fee.
 */
export function getMaxSendableNim(balanceInNim, feeInLuna = DEFAULT_FEE_LUNA) {
  const balanceLuna = nimToLuna(balanceInNim);
  const maxLuna = balanceLuna - feeInLuna;

  if (maxLuna <= 0) return 0;
  return lunaToNim(maxLuna);
}

/**
 * Execute JSON-RPC request against Testnet nodes.
 */
async function testnetRpc(method, params = []) {
  const candidates = resolvedTestnetRpc
    ? [resolvedTestnetRpc]
    : TESTNET_RPC_CANDIDATES;

  let lastError = null;

  for (const endpoint of candidates) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Nimiq Testnet RPC returned HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result?.error) {
        throw new Error(result.error.message || "Nimiq Testnet RPC error.");
      }

      resolvedTestnetRpc = endpoint;

      const payload = result?.result;
      if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
      }

      return payload;
    } catch (error) {
      lastError = error;
      console.warn(`Nimiq Testnet RPC candidate failed (${endpoint}):`, error?.message);
    }
  }

  throw new Error("Could not reach any Nimiq Testnet RPC endpoint.", { cause: lastError });
}

/**
 * Get account payload from Testnet RPC.
 */
export async function getTestnetAccount(address) {
  const formatted = cleanAddress(address);

  if (!formatted) {
    throw new Error("No wallet address provided.");
  }

  return await testnetRpc("getAccountByAddress", [formatted]);
}

/**
 * Detailed balance reader. Treats uninitialized testnet addresses as valid 0 NIM accounts.
 */
export async function fetchNimiqBalanceDetailed(address) {
  if (!address) {
    return { balance: 0, found: false };
  }

  try {
    const account = await getTestnetAccount(address);

    // Uninitialized address on-chain (valid testnet address with zero history)
    if (!account) {
      return { balance: 0, found: true };
    }

    const rawBalance = account.balance;
    if (rawBalance === undefined || rawBalance === null) {
      return { balance: 0, found: true };
    }

    const luna = Number(rawBalance);
    return { balance: lunaToNim(luna), found: true };
  } catch (error) {
    // True RPC failure / connection issues
    console.warn("Failed to fetch balance from Testnet RPC:", error);
    return { balance: 0, found: false };
  }
}

/**
 * Simplified balance getter for direct consumption.
 */
export async function fetchNimiqBalance(address) {
  const { balance } = await fetchNimiqBalanceDetailed(address);
  return balance;
}

/**
 * Get wallet testnet status & heuristic checks.
 */
export async function getTestnetWalletInfo(provider) {
  const nimiq = provider || (await initNimiq());
  const address = await getNimiqAccount(nimiq);

  const [{ balance, found }, providerBlockNumber] = await Promise.all([
    fetchNimiqBalanceDetailed(address),
    getBlockHeight(nimiq).catch(() => null),
  ]);

  let networkWarning = null;

  if (providerBlockNumber !== null) {
    try {
      const testnetBlockNumber = await testnetRpc("getBlockNumber", []);

      // High block difference indicates wallet is running on mainnet while RPC points to testnet
      if (
        typeof testnetBlockNumber === "number" &&
        Math.abs(testnetBlockNumber - providerBlockNumber) > 10_000
      ) {
        networkWarning =
          "Nimiq Pay block height differs significantly from Testnet. " +
          "Ensure Nimiq Pay is switched to Testnet via Dev Menu.";
      }
    } catch {
      // Best-effort check
    }
  }

  return {
    address,
    balance,
    found,
    network: "testnet",
    networkWarning,
  };
}

/**
 * Check provider consensus connection.
 */
export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());
  return Boolean(await nimiq.isConsensusEstablished());
}

/**
 * Get current block height from provider.
 */
export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());
  return await nimiq.getBlockNumber();
}

/**
 * Dispatch NIM transaction via Nimiq Pay.
 */
export async function sendNIMTransaction(provider, { recipient, valueInNim, data }) {
  const nimiq = provider || (await initNimiq());

  const cleanRecipient = cleanAddress(recipient);

  if (!cleanRecipient || !cleanRecipient.startsWith("NQ")) {
    throw new Error("Invalid recipient Nimiq address.");
  }

  const luna = nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error("Transaction amount must be greater than 0 NIM.");
  }

  try {
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
  } catch (error) {
    console.error("NIM transaction failed:", error);

    const message = error?.message?.toLowerCase() || "";

    if (
      message.includes("reject") ||
      message.includes("cancel") ||
      message.includes("denied") ||
      message.includes("permission_denied")
    ) {
      throw new Error("Transaction was rejected by the user.", { cause: error });
    }

    throw new Error(error?.message || "Failed to send NIM transaction.", {
      cause: error,
    });
  }
}