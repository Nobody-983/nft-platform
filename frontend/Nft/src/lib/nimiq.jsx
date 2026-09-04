import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

let cachedProvider = null;

/**
 * Initialize the Nimiq mini app provider with a timeout.
 * Reuses the existing provider instance if already initialized.
 */
export async function initNimiq(options = { timeout: 10_000 }) {
  if (cachedProvider) {
    return cachedProvider;
  }

  try {
    const provider = await init(options);
    cachedProvider = provider;
    return provider;
  } catch (error) {
    console.warn("Failed to initialize Nimiq provider:", error);
    throw new Error(
      "Nimiq Pay provider not available. Please ensure you are opening this mini app inside Nimiq Pay.",
      { cause: error }
    );
  }
}

/**
 * Check if the app is currently running in a Nimiq Pay environment.
 */
export function isNimiqEnvironment() {
  return typeof window !== "undefined" && (Boolean(window.nimiq) || Boolean(window.nimiqPay));
}

/**
 * Formats a Nimiq address into standard 4-character separated chunks.
 * e.g. "NQ07 0000 0000 0000 0000 0000 0000 0000 0000"
 */
export function formatNimiqAddress(address) {
  if (!address) return "";
  const cleaned = address.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const parts = cleaned.match(/.{1,4}/g);
  return parts ? parts.join(" ") : cleaned;
}

/**
 * Shorten an address for UI presentation (e.g. NQ07...0000)
 */
export function shortenAddress(address, leadingChars = 4, trailingChars = 4) {
  if (!address) return "";
  const cleaned = address.replace(/\s+/g, "");
  if (cleaned.length <= leadingChars + trailingChars) return cleaned;
  return `${cleaned.slice(0, leadingChars)}...${cleaned.slice(-trailingChars)}`;
}

/**
 * Clean spaces and special characters from address
 */
export function cleanAddress(address) {
  if (!address) return "";
  return address.replace(/\s+/g, "").toUpperCase();
}

/**
 * Convert NIM to Luna (1 NIM = 100,000 Luna)
 */
export function nimToLuna(nim) {
  const numeric = Number(nim);
  if (isNaN(numeric) || numeric < 0) return 0;
  return Math.round(numeric * LUNA_PER_NIM);
}

/**
 * Convert Luna to NIM
 */
export function lunaToNim(luna) {
  const numeric = Number(luna);
  if (isNaN(numeric) || numeric <= 0) return 0;
  return numeric / LUNA_PER_NIM;
}

/**
 * Check network consensus from provider
 */
export async function getConsensusStatus(provider) {
  try {
    if (!provider) return false;
    return await provider.isConsensusEstablished();
  } catch (err) {
    console.error("Error checking consensus:", err);
    return false;
  }
}

/**
 * Get current blockchain block height
 */
export async function getBlockHeight(provider) {
  try {
    if (!provider) return null;
    return await provider.getBlockNumber();
  } catch (err) {
    console.error("Error getting block number:", err);
    return null;
  }
}

/**
 * Fetch balance for a Nimiq address via public RPC endpoints
 */
export async function fetchNimiqBalance(address) {
  if (!address) return 0;
  const formatted = cleanAddress(address);

  // Try public Nimiq JSON-RPC endpoints
  const endpoints = [
    "https://rpc.nimiqwatch.com",
    "https://rpc.pos.nimiq.com",
    "https://rpc.pos.nimiq-testnet.com",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getAccountByAddress",
          params: [formatted],
          id: 1,
        }),
      });

      if (!response.ok) continue;

      const result = await response.json();
      if (result && result.result && typeof result.result.balance === "number") {
        return lunaToNim(result.result.balance);
      }
    } catch {
      // Ignore individual endpoint failure and try next
    }
  }

  return 0;
}

/**
 * Send basic NIM transaction with optional data string
 * Requires native approval in Nimiq Pay.
 */
export async function sendNIMTransaction(provider, { recipient, valueInNim, data }) {
  if (!provider) {
    throw new Error("Nimiq provider is not initialized.");
  }

  const cleanRecipient = cleanAddress(recipient);
  if (!cleanRecipient || !cleanRecipient.startsWith("NQ")) {
    throw new Error("Invalid recipient Nimiq address. It should begin with 'NQ'.");
  }

  const luna = nimToLuna(valueInNim);
  if (luna <= 0) {
    throw new Error("Please enter an amount greater than 0 NIM.");
  }

  try {
    if (data && data.trim()) {
      const txHash = await provider.sendBasicTransactionWithData({
        recipient: cleanRecipient,
        value: luna,
        data: data.trim(),
      });
      return txHash;
    } else {
      const txHash = await provider.sendBasicTransaction({
        recipient: cleanRecipient,
        value: luna,
      });
      return txHash;
    }
  } catch (err) {
    console.error("sendNIMTransaction error:", err);
    const msg = err?.message?.toLowerCase() || "";
    if (msg.includes("reject") || msg.includes("cancel") || msg.includes("denied")) {
      throw new Error("Transaction was rejected by user.", { cause: err });
    }
    throw new Error(err?.message || "Failed to send transaction.", { cause: err });
  }
}
