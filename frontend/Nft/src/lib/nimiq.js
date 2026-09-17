
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// Small safety reserve when calculating "send max".
export const DEFAULT_FEE_LUNA = 100;

let providerPromise = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * The active Nimiq network is controlled by Nimiq Pay.
 * We do NOT force Mainnet/Testnet through an RPC URL here.
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
      console.error(
        "Nimiq provider initialization failed:",
        error
      );

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
 * Clean a Nimiq address.
 */
export function cleanAddress(address) {
  if (!address) {
    return "";
  }

  return String(address)
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Check whether a string looks like a Nimiq address.
 */
export function isValidNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  return (
    cleaned.startsWith("NQ") &&
    cleaned.length === 36
  );
}

/**
 * Get the first connected Nimiq account.
 */
export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error(
      "No Nimiq wallet account is connected."
    );
  }

  return cleanAddress(accounts[0]);
}

/**
 * Get every connected Nimiq account.
 */
export async function getNimiqAccounts(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  return (accounts || []).map(cleanAddress);
}

/**
 * Format a Nimiq address into groups of four characters.
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
 * Calculate the maximum amount of NIM that can be sent
 * while keeping the configured fee reserve.
 */
export function getMaxSendableNim(
  balanceInNim,
  feeInLuna = DEFAULT_FEE_LUNA
) {
  const balanceLuna = nimToLuna(
    balanceInNim
  );

  const availableLuna =
    balanceLuna - feeInLuna;

  if (availableLuna <= 0) {
    return 0;
  }

  return lunaToNim(
    availableLuna
  );
}

/**
 * Get consensus status from Nimiq Pay.
 */
export async function getConsensusStatus(provider) {
  const nimiq =
    provider || (await initNimiq());

  return Boolean(
    await nimiq.isConsensusEstablished()
  );
}

/**
 * Get the current block height from Nimiq Pay.
 */
export async function getBlockHeight(provider) {
  const nimiq =
    provider || (await initNimiq());

  return await nimiq.getBlockNumber();
}

/**
 * Get basic wallet/network information.
 *
 * The provider is the source of truth for the wallet.
 */
export async function getTestnetWalletInfo(
  provider
) {
  const nimiq =
    provider || (await initNimiq());

  const address =
    await getNimiqAccount(nimiq);

  const [consensus, blockNumber] =
    await Promise.all([
      getConsensusStatus(nimiq),
      getBlockHeight(nimiq),
    ]);

  return {
    address,
    consensus,
    blockNumber,
  };
}

/**
 * Send NIM through Nimiq Pay.
 *
 * Nimiq Pay controls the active network.
 */
export async function sendNIMTransaction(
  provider,
  {
    recipient,
    valueInNim,
    data,
  }
) {
  const nimiq =
    provider || (await initNimiq());

  const cleanRecipient =
    cleanAddress(recipient);

  if (
    !isValidNimiqAddress(cleanRecipient)
  ) {
    throw new Error(
      "Invalid recipient Nimiq address."
    );
  }

  const luna =
    nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error(
      "Transaction amount must be greater than 0 NIM."
    );
  }

  try {
    if (
      typeof data === "string" &&
      data.trim()
    ) {
      return await nimiq.sendBasicTransactionWithData(
        {
          recipient: cleanRecipient,
          value: luna,
          data: data.trim(),
        }
      );
    }

    return await nimiq.sendBasicTransaction({
      recipient: cleanRecipient,
      value: luna,
    });
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
      message.includes("denied") ||
      message.includes("permission_denied")
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
