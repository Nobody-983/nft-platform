
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

export const TESTNET_RPC =
  "https://rpc.pos.nimiq-testnet.com";

let cachedProvider = null;

/**
 * Initialize the Nimiq mini app provider.
 */
export async function initNimiq(
  options = { timeout: 10_000 }
) {
  if (cachedProvider) {
    return cachedProvider;
  }

  try {
    const provider = await init(options);

    cachedProvider = provider;

    return provider;
  } catch (error) {
    console.warn(
      "Failed to initialize Nimiq provider:",
      error
    );

    throw new Error(
      "Nimiq Pay provider not available. Please ensure the app is opened inside Nimiq Pay.",
      {
        cause: error,
      }
    );
  }
}

/**
 * Check if the app is running inside Nimiq Pay.
 */
export function isNimiqEnvironment() {
  return (
    typeof window !== "undefined" &&
    (Boolean(window.nimiq) ||
      Boolean(window.nimiqPay))
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
 * Shorten a Nimiq address.
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

  return Math.round(
    numeric * LUNA_PER_NIM
  );
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
 * Get testnet account information.
 */
export async function getTestnetAccount(address) {
  if (!address) {
    throw new Error(
      "Wallet address is required."
    );
  }

  const formattedAddress =
    cleanAddress(address);

  const response = await fetch(TESTNET_RPC, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getAccountByAddress",
      params: [formattedAddress],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Testnet RPC returned HTTP ${response.status}`
    );
  }

  const json = await response.json();

  console.log(
    "Nimiq Testnet RPC response:",
    json
  );

  if (json?.error) {
    throw new Error(
      json.error.message ||
        "Nimiq testnet RPC returned an error."
    );
  }

  return json?.result ?? null;
}

/**
 * Fetch NIM balance from Nimiq Testnet.
 */
export async function fetchNimiqBalance(address) {
  if (!address) {
    return 0;
  }

  try {
    const account =
      await getTestnetAccount(address);

    if (!account) {
      console.log(
        "No testnet account found for:",
        cleanAddress(address)
      );

      return 0;
    }

    /*
     * RPC values can arrive as either:
     *
     * number
     * string
     *
     * Therefore we explicitly convert it.
     */

    const rawBalance =
      account.balance;

    if (
      rawBalance === undefined ||
      rawBalance === null
    ) {
      console.warn(
        "Testnet account has no balance:",
        account
      );

      return 0;
    }

    const luna = Number(rawBalance);

    if (!Number.isFinite(luna)) {
      console.error(
        "Invalid testnet balance:",
        rawBalance
      );

      return 0;
    }

    const nim = lunaToNim(luna);

    console.log(
      `Nimiq Testnet Balance: ${nim} NIM`
    );

    return nim;
  } catch (err) {
    console.error(
      "Failed to fetch Nimiq testnet balance:",
      err
    );

    throw err;
  }
}

/**
 * Check network consensus.
 */
export async function getConsensusStatus(
  provider
) {
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
 * Send NIM transaction.
 *
 * IMPORTANT:
 * The transaction is approved by
 * Nimiq Pay.
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
    if (
      data &&
      data.trim()
    ) {
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
        {
          cause: err,
        }
      );
    }

    throw new Error(
      err?.message ||
        "Failed to send transaction.",
      {
        cause: err,
      }
    );
  }
}

