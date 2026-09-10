
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

const TESTNET_RPC = "https://rpc.pos.nimiq-testnet.com";

let cachedProvider = null;

/**
 * Initialize the Nimiq mini app provider.
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
 * Check if the app is running in a Nimiq Pay environment.
 */
export function isNimiqEnvironment() {
  return (
    typeof window !== "undefined" &&
    (Boolean(window.nimiq) || Boolean(window.nimiqPay))
  );
}

/**
 * Format a Nimiq address.
 */
export function formatNimiqAddress(address) {
  if (!address) return "";

  const cleaned = address
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  const parts = cleaned.match(/.{1,4}/g);

  return parts ? parts.join(" ") : cleaned;
}

/**
 * Shorten an address for UI.
 */
export function shortenAddress(
  address,
  leadingChars = 4,
  trailingChars = 4
) {
  if (!address) return "";

  const cleaned = address.replace(/\s+/g, "");

  if (cleaned.length <= leadingChars + trailingChars) {
    return cleaned;
  }

  return `${cleaned.slice(0, leadingChars)}...${cleaned.slice(-trailingChars)}`;
}

/**
 * Clean Nimiq address.
 */
export function cleanAddress(address) {
  if (!address) return "";

  return address
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Convert NIM to Luna.
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
 * Check network consensus.
 */
export async function getConsensusStatus(provider) {
  try {
    if (!provider) return false;

    return Boolean(
      await provider.isConsensusEstablished()
    );
  } catch (err) {
    console.error(
      "Error checking consensus:",
      err
    );

    return false;
  }
}

/**
 * Get current blockchain block height.
 */
export async function getBlockHeight(provider) {
  try {
    if (!provider) return null;

    return await provider.getBlockNumber();
  } catch (err) {
    console.error(
      "Error getting block number:",
      err
    );

    return null;
  }
}

/**
 * Fetch balance from Nimiq Testnet.
 */
export async function fetchNimiqBalance(address) {
  if (!address) return 0;

  const formatted = cleanAddress(address);

  try {
    const response = await fetch(TESTNET_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getAccountByAddress",
        params: [formatted],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Testnet RPC returned HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (
      result?.result &&
      typeof result.result.balance === "number"
    ) {
      return lunaToNim(
        result.result.balance
      );
    }

    return 0;
  } catch (err) {
    console.error(
      "Failed to fetch Nimiq testnet balance:",
      err
    );

    return 0;
  }
}

/**
 * Send a NIM transaction.
 * The transaction is approved by Nimiq Pay.
 */
export async function sendNIMTransaction(
  provider,
  { recipient, valueInNim, data }
) {
  if (!provider) {
    throw new Error(
      "Nimiq provider is not initialized."
    );
  }

  const cleanRecipient = cleanAddress(
    recipient
  );

  if (
    !cleanRecipient ||
    !cleanRecipient.startsWith("NQ")
  ) {
    throw new Error(
      "Invalid recipient Nimiq address."
    );
  }

  const luna = nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error(
      "Please enter an amount greater than 0 NIM."
    );
  }

  try {
    if (data && data.trim()) {
      return await provider.sendBasicTransactionWithData(
        {
          recipient: cleanRecipient,
          value: luna,
          data: data.trim(),
        }
      );
    }

    return await provider.sendBasicTransaction({
      recipient: cleanRecipient,
      value: luna,
    });
  } catch (err) {
    console.error(
      "sendNIMTransaction error:",
      err
    );

    const message =
      err?.message?.toLowerCase() || "";

    if (
      message.includes("reject") ||
      message.includes("cancel") ||
      message.includes("denied")
    ) {
      throw new Error(
        "Transaction was rejected by user.",
        { cause: err }
      );
    }

    throw new Error(
      err?.message ||
        "Failed to send transaction.",
      { cause: err }
    );
  }
}
