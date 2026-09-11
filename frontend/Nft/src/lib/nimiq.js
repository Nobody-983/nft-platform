import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

export const TESTNET_RPC =
  "https://rpc.pos.nimiq-testnet.com";

let cachedProvider = null;

/**
 * Initialize Nimiq Pay provider
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
    console.error(
      "Failed to initialize Nimiq provider:",
      error
    );

    throw new Error(
      "Nimiq Pay provider not available. Open this app inside Nimiq Pay.",
      { cause: error }
    );
  }
}

/**
 * Check if running inside Nimiq environment
 */
export function isNimiqEnvironment() {
  return (
    typeof window !== "undefined" &&
    (Boolean(window.nimiq) ||
      Boolean(window.nimiqPay))
  );
}

/**
 * Format Nimiq address
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
 * Shorten Nimiq address
 */
export function shortenAddress(
  address,
  leadingChars = 4,
  trailingChars = 4
) {
  if (!address) return "";

  const cleaned = address.replace(/\s+/g, "");

  if (
    cleaned.length <=
    leadingChars + trailingChars
  ) {
    return cleaned;
  }

  return `${cleaned.slice(
    0,
    leadingChars
  )}...${cleaned.slice(-trailingChars)}`;
}

/**
 * Remove spaces from address
 */
export function cleanAddress(address) {
  if (!address) return "";

  return address
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Convert NIM to Luna
 */
export function nimToLuna(nim) {
  const numeric = Number(nim);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.round(
    numeric * LUNA_PER_NIM
  );
}

/**
 * Convert Luna to NIM
 */
export function lunaToNim(luna) {
  const numeric = Number(luna);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return numeric / LUNA_PER_NIM;
}

/**
 * Get account information from Nimiq Testnet
 */
export async function getTestnetAccount(address) {
  if (!address) {
    throw new Error(
      "No wallet address provided."
    );
  }

  const formatted = cleanAddress(address);

  try {
    const response = await fetch(
      TESTNET_RPC,
      {
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
      }
    );

    if (!response.ok) {
      throw new Error(
        `Testnet RPC returned HTTP ${response.status}`
      );
    }

    const result = await response.json();

    console.log(
      "========== NIMIQ TESTNET =========="
    );

    console.log(
      "Wallet address:",
      formatted
    );

    console.log(
      "RPC response:",
      result
    );

    console.log(
      "==================================="
    );

    if (result?.error) {
      throw new Error(
        result.error.message ||
          "Nimiq Testnet RPC error."
      );
    }

    return result?.result || null;
  } catch (error) {
    console.error(
      "Testnet account request failed:",
      error
    );

    throw error;
  }
}

/**
 * Fetch NIM balance from Nimiq Testnet
 */
export async function fetchNimiqBalance(address) {
  if (!address) {
    return 0;
  }

  try {
    const account =
      await getTestnetAccount(address);

    console.log(
      "Testnet account:",
      account
    );

    if (!account) {
      console.warn(
        "No account returned from Testnet RPC."
      );

      return 0;
    }

    const rawBalance = account.balance;

    console.log(
      "Raw Testnet balance:",
      rawBalance
    );

    console.log(
      "Balance type:",
      typeof rawBalance
    );

    if (
      rawBalance === undefined ||
      rawBalance === null
    ) {
      console.warn(
        "Testnet account has no balance field."
      );

      return 0;
    }

    const luna = Number(rawBalance);

    if (!Number.isFinite(luna)) {
      throw new Error(
        `Invalid balance returned by Testnet RPC: ${rawBalance}`
      );
    }

    const nim = lunaToNim(luna);

    console.log(
      "Testnet balance:",
      nim,
      "NIM"
    );

    return nim;
  } catch (error) {
    console.error(
      "Failed to fetch Nimiq Testnet balance:",
      error
    );

    throw error;
  }
}

/**
 * Check Nimiq consensus
 */
export async function getConsensusStatus(
  provider
) {
  try {
    if (!provider) {
      return false;
    }

    return Boolean(
      await provider.isConsensusEstablished()
    );
  } catch (error) {
    console.error(
      "Consensus check failed:",
      error
    );

    return false;
  }
}

/**
 * Get current block height
 */
export async function getBlockHeight(
  provider
) {
  try {
    if (!provider) {
      return null;
    }

    return await provider.getBlockNumber();
  } catch (error) {
    console.error(
      "Block height request failed:",
      error
    );

    return null;
  }
}

/**
 * Send NIM transaction through Nimiq Pay
 */
export async function sendNIMTransaction(
  provider,
  {
    recipient,
    valueInNim,
    data,
  }
) {
  if (!provider) {
    throw new Error(
      "Nimiq provider is not initialized."
    );
  }

  const cleanRecipient =
    cleanAddress(recipient);

  if (
    !cleanRecipient ||
    !cleanRecipient.startsWith("NQ")
  ) {
    throw new Error(
      "Invalid recipient Nimiq address."
    );
  }

  const luna =
    nimToLuna(valueInNim);

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

    return await provider.sendBasicTransaction(
      {
        recipient: cleanRecipient,
        value: luna,
      }
    );
  } catch (error) {
    console.error(
      "NIM transaction failed:",
      error
    );

    const message =
      error?.message?.toLowerCase() || "";

    if (
      message.includes("reject") ||
      message.includes("cancel") ||
      message.includes("denied")
    ) {
      throw new Error(
        "Transaction was rejected by the user.",
        { cause: error }
      );
    }

    throw new Error(
      error?.message ||
        "Failed to send NIM transaction.",
      { cause: error }
    );
  }
}