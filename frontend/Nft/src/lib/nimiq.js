
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// Small safety reserve when calculating "send max".
export const DEFAULT_FEE_LUNA = 100;

let providerPromise = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * IMPORTANT:
 * The network used by the Nimiq Pay wallet is controlled by
 * Nimiq Pay itself. This function does not switch networks.
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
      console.error("Nimiq provider initialization failed:", error);

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
 * Clear the cached provider.
 */
export function clearNimiqProvider() {
  providerPromise = null;
}

/**
 * Remove spaces and normalize a Nimiq address.
 */
export function cleanAddress(address) {
  if (!address) {
    return "";
  }

  return String(address).replace(/\s+/g, "").toUpperCase();
}

/**
 * Alias kept for compatibility with existing imports.
 */
export const cleanNimiqAddress = cleanAddress;

/**
 * Check whether a string looks like a Nimiq address.
 */
export function isValidNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  return cleaned.startsWith("NQ") && cleaned.length === 36;
}

/**
 * Get the first connected Nimiq account.
 *
 * listAccounts() is the official Mini App provider method.
 */
export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error("No Nimiq wallet account is connected.");
  }

  const address = cleanAddress(accounts[0]);

  if (!isValidNimiqAddress(address)) {
    throw new Error("Nimiq Pay returned an invalid wallet address.");
  }

  return address;
}

/**
 * Get every connected Nimiq account.
 */
export async function getNimiqAccounts(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts
    .map(cleanAddress)
    .filter(isValidNimiqAddress);
}

/**
 * Format a Nimiq address into user-friendly groups.
 *
 * Example:
 *
 * NQ00000000000000000000000000000000
 *
 * becomes:
 *
 * NQ00 0000 0000 0000 0000 0000 0000 0000 00
 */
export function formatNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  const parts = cleaned.match(/.{1,4}/g);

  return parts ? parts.join(" ") : cleaned;
}

/**
 * Alias kept for compatibility.
 */
export const formatForProvider = (address) => {
  const cleaned = cleanAddress(address);

  if (!isValidNimiqAddress(cleaned)) {
    throw new Error("Invalid Nimiq wallet address.");
  }

  return formatNimiqAddress(cleaned);
};

/**
 * Shorten a Nimiq address for UI display.
 */
export function shortenAddress(
  address,
  leadingChars = 4,
  trailingChars = 4
) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  if (cleaned.length <= leadingChars + trailingChars) {
    return cleaned;
  }

  return `${cleaned.slice(0, leadingChars)}...${cleaned.slice(-trailingChars)}`;
}

/**
 * Alias kept for compatibility.
 */
export const shortenNimiqAddress = shortenAddress;

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
 * Format NIM for UI display.
 */
export function formatNim(nim, maximumFractionDigits = 5) {
  const numeric = Number(nim);

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(numeric);
}

/**
 * Calculate the maximum amount of NIM that can be sent
 * while keeping the configured fee reserve.
 */
export function getMaxSendableNim(
  balanceInNim,
  feeInLuna = DEFAULT_FEE_LUNA
) {
  const balanceLuna = nimToLuna(balanceInNim);
  const availableLuna = balanceLuna - feeInLuna;

  if (availableLuna <= 0) {
    return 0;
  }

  return lunaToNim(availableLuna);
}

/**
 * Check whether the Nimiq Pay provider has reached consensus.
 */
export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());

  return Boolean(await nimiq.isConsensusEstablished());
}

/**
 * Get the current block height from Nimiq Pay.
 */
export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());

  return await nimiq.getBlockNumber();
}

/**
 * Get wallet information from the Nimiq Pay provider.
 *
 * IMPORTANT:
 * We intentionally do not return a fake "network: testnet" value.
 *
 * The Mini App provider API does not expose a method that lets the
 * app switch or reliably label the wallet as testnet/mainnet.
 */
export async function getTestnetWalletInfo(provider) {
  const nimiq = provider || (await initNimiq());

  const address = await getNimiqAccount(nimiq);

  const [consensus, blockNumber] = await Promise.all([
    getConsensusStatus(nimiq).catch(() => false),
    getBlockHeight(nimiq).catch(() => null),
  ]);

  return {
    address,
    balance: null,
    found: false,
    consensus,
    blockNumber,

    // This is deliberately informational rather than a claim.
    network: null,

    networkWarning:
      "Network selection is controlled by Nimiq Pay, not by the Mini App.",
  };
}

/**
 * Balance compatibility function.
 *
 * The Mini App provider API does not expose a getBalance() method.
 *
 * Returning null is preferable to querying an unreliable RPC endpoint
 * and displaying an incorrect 0 NIM balance.
 */
export async function fetchNimiqBalanceDetailed(address) {
  const cleanedAddress = cleanAddress(address);

  if (!cleanedAddress) {
    return {
      balance: null,
      found: false,
      error: "No Nimiq wallet address was provided.",
    };
  }

  return {
    balance: null,
    found: false,
    error:
      "Balance is not exposed directly by the Nimiq Pay Mini App provider.",
  };
}

/**
 * Simple balance compatibility getter.
 *
 * Returns null when the provider cannot supply the balance.
 */
export async function fetchNimiqBalance(address) {
  const result = await fetchNimiqBalanceDetailed(address);

  return result.balance;
}

/**
 * Send NIM through Nimiq Pay.
 *
 * Values are sent in Luna.
 */
export async function sendNIMTransaction(
  provider,
  { recipient, valueInNim, data }
) {
  const nimiq = provider || (await initNimiq());

  const cleanedRecipient = cleanAddress(recipient);

  if (!isValidNimiqAddress(cleanedRecipient)) {
    throw new Error("Invalid Nimiq recipient address.");
  }

  const providerRecipient = formatNimiqAddress(cleanedRecipient);

  const luna = nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error("Transaction amount must be greater than 0 NIM.");
  }

  try {
    if (
      typeof data === "string" &&
      data.trim() &&
      typeof nimiq.sendBasicTransactionWithData === "function"
    ) {
      return await nimiq.sendBasicTransactionWithData({
        recipient: providerRecipient,
        value: luna,
        data: data.trim(),
      });
    }

    if (typeof nimiq.sendBasicTransaction !== "function") {
      throw new Error(
        "Nimiq Pay does not provide the transaction method required by this app."
      );
    }

    return await nimiq.sendBasicTransaction({
      recipient: providerRecipient,
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
      throw new Error("Transaction was rejected by the user.", {
        cause: error,
      });
    }

    throw new Error(
      error?.message || "Failed to send NIM transaction.",
      {
        cause: error,
      }
    );
  }
}
