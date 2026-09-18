import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

let cachedProvider = null;
let coreClientPromise = null;

/**
 * Initialize Nimiq Pay.
 *
 * This is kept separate from the Web Client because the Mini App SDK
 * handles the user's wallet connection, signing and transactions.
 */
export async function initNimiq(options = {}) {
  if (cachedProvider) {
    return cachedProvider;
  }

  try {
    cachedProvider = await init(options);
    return cachedProvider;
  } catch (error) {
    cachedProvider = null;

    throw new Error(
      error?.message || "Could not initialize Nimiq Pay.",
      { cause: error }
    );
  }
}

/**
 * Clear the cached Nimiq Pay provider.
 */
export function clearNimiqProvider() {
  cachedProvider = null;
}

/**
 * Initialize the Nimiq Web Client on Testnet.
 *
 * IMPORTANT:
 * This does NOT change the Nimiq Pay wallet network.
 * It only makes the Web Client connect to the Nimiq Testnet
 * so we can read Testnet blockchain data.
 */
async function getTestnetClient() {
  if (coreClientPromise) {
    return coreClientPromise;
  }

  coreClientPromise = (async () => {
    try {
      await initCore();

      const config = new NimiqCore.ClientConfiguration();

      // Official Nimiq Web Client Testnet configuration.
      config.network("TestAlbatross");

      const client = await NimiqCore.Client.create(config.build());

      await client.waitForConsensusEstablished();

      return client;
    } catch (error) {
      coreClientPromise = null;

      console.error(
        "Nimiq Testnet Web Client initialization failed:",
        error
      );

      throw new Error(
        error?.message ||
          "Could not connect to the Nimiq Testnet blockchain.",
        { cause: error }
      );
    }
  })();

  return coreClientPromise;
}

/**
 * Remove spaces from a Nimiq user-friendly address.
 */
export function cleanAddress(address) {
  if (!address) return "";

  return String(address)
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

// Compatibility alias.
export const cleanNimiqAddress = cleanAddress;

/**
 * Basic Nimiq address check.
 */
export function isValidNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  return /^NQ[A-Z0-9]{32}$/.test(cleaned);
}

/**
 * Get the connected wallet address from Nimiq Pay.
 *
 * IMPORTANT:
 * Keep using listAccounts().
 * This preserves the existing wallet connection flow.
 */
export async function getNimiqAccount(provider) {
  if (!provider) {
    throw new Error("Nimiq Pay provider is not available.");
  }

  if (typeof provider.listAccounts !== "function") {
    throw new Error(
      "This version of Nimiq Pay does not support listAccounts()."
    );
  }

  const accounts = await provider.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error("No Nimiq wallet account is connected.");
  }

  return accounts[0];
}

/**
 * Get all connected Nimiq Pay accounts.
 */
export async function getNimiqAccounts(provider) {
  if (!provider) {
    throw new Error("Nimiq Pay provider is not available.");
  }

  if (typeof provider.listAccounts !== "function") {
    throw new Error(
      "This version of Nimiq Pay does not support listAccounts()."
    );
  }

  return provider.listAccounts();
}

/**
 * Format a Nimiq address for display/API usage.
 */
export function formatNimiqAddress(address) {
  return cleanAddress(address);
}

/**
 * Format an address for Nimiq Pay provider calls.
 */
export function formatForProvider(address) {
  return cleanAddress(address);
}

/**
 * Shorten an address for the UI.
 */
export function shortenAddress(address, start = 8, end = 8) {
  const cleaned = cleanAddress(address);

  if (!cleaned) return "";

  if (cleaned.length <= start + end + 3) {
    return cleaned;
  }

  return `${cleaned.slice(0, start)}...${cleaned.slice(-end)}`;
}

// Compatibility alias.
export const shortenNimiqAddress = shortenAddress;

/**
 * Convert NIM to Luna.
 */
export function nimToLuna(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    throw new Error("Invalid NIM amount.");
  }

  return Math.round(value * LUNA_PER_NIM);
}

/**
 * Convert Luna to NIM.
 */
export function lunaToNim(luna) {
  const value = Number(luna);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value / LUNA_PER_NIM;
}

/**
 * Format a Luna balance as NIM.
 */
export function formatNim(luna, maximumFractionDigits = 5) {
  const nim = lunaToNim(luna);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(nim);
}

/**
 * Calculate the maximum amount that can safely be sent.
 */
export function getMaxSendableNim(balanceLuna) {
  const balance = Number(balanceLuna);

  if (!Number.isFinite(balance) || balance <= DEFAULT_FEE_LUNA) {
    return 0;
  }

  return lunaToNim(balance - DEFAULT_FEE_LUNA);
}

/**
 * Get a wallet's Testnet account directly from the Nimiq Web Client.
 *
 * There is NO HTTP RPC fetch here.
 */
export async function fetchNimiqBalanceDetailed(targetAddress) {
  const cleanedAddress = cleanAddress(targetAddress);

  if (!cleanedAddress) {
    return {
      balance: 0,
      found: false,
      error: "A Nimiq wallet address is required.",
    };
  }

  try {
    const client = await getTestnetClient();

    const account = await client.getAccount(cleanedAddress);

    if (!account) {
      return {
        balance: 0,
        found: false,
        error: "Wallet account was not found on Nimiq Testnet.",
      };
    }

    const rawBalance = account.balance;

    if (rawBalance === undefined || rawBalance === null) {
      return {
        balance: 0,
        found: false,
        error: "The Testnet account did not return a balance.",
      };
    }

    const balance = Number(rawBalance);

    if (!Number.isFinite(balance)) {
      return {
        balance: 0,
        found: false,
        error: "The Testnet returned an invalid wallet balance.",
      };
    }

    return {
      balance,
      found: true,
      error: null,
    };
  } catch (error) {
    const message =
      error?.message ||
      "Unable to read the wallet balance from Nimiq Testnet.";

    return {
      balance: 0,
      found: false,
      error: message,
    };
  }
}

/**
 * Simple balance helper.
 */
export async function fetchNimiqBalance(targetAddress) {
  const result = await fetchNimiqBalanceDetailed(targetAddress);

  return result.balance;
}

/**
 * Check consensus through the Nimiq Pay provider.
 *
 * This describes the provider's current consensus state.
 */
export async function getConsensusStatus(provider) {
  if (!provider) {
    return false;
  }

  if (typeof provider.isConsensusEstablished === "function") {
    return provider.isConsensusEstablished();
  }

  return false;
}

/**
 * Get the current block height from Nimiq Pay.
 */
export async function getBlockHeight(provider) {
  if (!provider) {
    return null;
  }

  if (typeof provider.getBlockNumber === "function") {
    return provider.getBlockNumber();
  }

  return null;
}

/**
 * Combined wallet information.
 */
export async function getTestnetWalletInfo(targetAddress) {
  const balanceInfo = await fetchNimiqBalanceDetailed(targetAddress);

  return {
    address: cleanAddress(targetAddress),
    balance: balanceInfo.balance,
    balanceNim: lunaToNim(balanceInfo.balance),
    found: balanceInfo.found,
    error: balanceInfo.error,
  };
}

/**
 * Send NIM through Nimiq Pay.
 *
 * IMPORTANT:
 * The first argument is the Nimiq Pay provider,
 * NOT the wallet address.
 */
export async function sendNIMTransaction(
  provider,
  { recipient, valueInNim, data = null }
) {
  if (!provider) {
    throw new Error("Nimiq Pay provider is not available.");
  }

  const cleanedRecipient = cleanAddress(recipient);

  if (!cleanedRecipient) {
    throw new Error("A recipient wallet address is required.");
  }

  const value = nimToLuna(valueInNim);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("The NIM amount must be greater than zero.");
  }

  if (data && typeof provider.sendBasicTransactionWithData === "function") {
    return provider.sendBasicTransactionWithData({
      recipient: cleanedRecipient,
      value,
      data,
    });
  }

  if (typeof provider.sendBasicTransaction === "function") {
    return provider.sendBasicTransaction({
      recipient: cleanedRecipient,
      value,
    });
  }

  throw new Error(
    "This version of Nimiq Pay does not support NIM transactions."
  );
}
