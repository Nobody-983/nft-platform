// lib/nimiq.js

const RPC_URL = "https://rpc.testnet.nimiq.network";

/**
 * Initializes or returns the Nimiq Pay window provider inside the Mini App WebView
 */
export async function initNimiq({ timeout = 10000 } = {}) {
  if (typeof window === "undefined") return null;

  // Check if injected by Nimiq Pay mobile container
  if (window.nimiq) return window.nimiq;

  // Poll for provider injection up to timeout duration
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (window.nimiq) return window.nimiq;
    await new Promise((res) => setTimeout(res, 100));
  }

  throw new Error("Nimiq Pay provider not detected in window environment.");
}

/**
 * Retrieves the currently connected wallet address from the provider
 */
export async function getNimiqAccount(provider) {
  if (!provider) return null;

  try {
    // Attempt provider method or standard address accessor
    const account = await provider.getAccount?.() || provider.address;
    return account || null;
  } catch (err) {
    console.error("Failed to retrieve Nimiq account:", err);
    return null;
  }
}

/**
 * Fetches detailed account balance directly from the Nimiq RPC endpoint,
 * safely handling non-existent/unindexed accounts without throwing resolution exceptions.
 */
export async function fetchNimiqBalanceDetailed(targetAddress) {
  if (!targetAddress) {
    return { balance: 0, found: false };
  }

  // Ensure address string is formatted without trailing whitespace
  const cleanAddress = String(targetAddress).trim();

  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getAccountByAddress",
        params: [cleanAddress],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const payload = await response.json();

    // RPC returns an error or empty result if account has never been funded/indexed
    if (payload.error || !payload.result) {
      return { balance: 0, found: false };
    }

    // Convert Luna units to NIM (1 NIM = 100,000 Luna)
    const lunaBalance = payload.result.balance || 0;
    const nimBalance = lunaBalance / 100000;

    return {
      balance: nimBalance,
      found: true,
    };
  } catch (err) {
    console.warn("[nimiq] RPC lookup failed:", err.message);
    return { balance: 0, found: false };
  }
}

/**
 * Checks node consensus status
 */
export async function getConsensusStatus(provider) {
  try {
    if (provider?.getConsensusStatus) {
      return await provider.getConsensusStatus();
    }
    return true; // Default fallback for light web clients
  } catch (err) {
    return false;
  }
}

/**
 * Retrieves latest block height from RPC node
 */
export async function getBlockHeight(provider) {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getBlockNumber",
        params: [],
        id: 1,
      }),
    });

    const payload = await response.json();
    return payload.result ?? null;
  } catch (err) {
    return null;
  }
}

/**
 * Clears provider references during teardown or disconnect
 */
export function clearNimiqProvider() {
  if (typeof window !== "undefined" && window.nimiq) {
    // Retain injection object, reset local state handle
  }
}