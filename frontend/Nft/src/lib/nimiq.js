import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

export const LUNA_PER_NIM = 100_000;

// Small safety reserve when calculating "send max".
export const DEFAULT_FEE_LUNA = 100;

let providerPromise = null;
let coreClientPromise = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * IMPORTANT:
 * Nimiq Pay controls the wallet's selected network.
 * This function only connects to the provider.
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
 * Clear the cached Nimiq Pay provider.
 */
export function clearNimiqProvider() {
  providerPromise = null;
}

/**
 * Initialize the Nimiq Web Client on TestAlbatross.
 *
 * This client is used ONLY for reading Testnet blockchain data,
 * such as account balances.
 *
 * It does NOT control the Nimiq Pay wallet network.
 */
async function getTestnetClient() {
  if (coreClientPromise) {
    return coreClientPromise;
  }

  coreClientPromise = (async () => {
    try {
      await initCore();

      const config = new NimiqCore.ClientConfiguration();

      // Explicitly connect the Web Client to Nimiq Testnet.
      config.network("TestAlbatross");

      const client = await NimiqCore.Client.create(config.build());

      await client.waitForConsensusEstablished();

      return client;
    } catch (error) {
      coreClientPromise = null;

      console.error(
        "Failed to initialize Nimiq Testnet Web Client:",
        error
      );

      throw new Error(
        "Could not connect to the Nimiq Testnet blockchain.",
        { cause: error }
      );
    }
  })();

  return coreClientPromise;
}

/**
 * Remove spaces and normalize a Nimiq address.
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
 * Compatibility alias.
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
 * Get the first connected Nimiq Pay account.
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
 * Get every connected Nimiq Pay account.
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
 * Prepare an address for Nimiq Pay provider methods.
 */
export function formatForProvider(address) {
  const cleaned = cleanAddress(address);

  if (!isValidNimiqAddress(cleaned)) {
    throw new Error("Invalid Nimiq wallet address.");
  }

  return formatNimiqAddress(cleaned);
}

/**
 * Shorten a Nimiq address for UI.
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
 * Compatibility alias.
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
 * Format NIM for display.
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
 * Calculate maximum sendable NIM.
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
 * Fetch the real account balance from Nimiq Testnet.
 *
 * The Web Client connects directly to TestAlbatross.
 *
 * Nimiq docs:
 * client.getAccount(address)
 * account.balance -> Luna
 */
export async function fetchNimiqBalanceDetailed(address) {
  const cleanedAddress = cleanAddress(address);

  if (!cleanedAddress) {
    return {
      balance: 0,
      found: false,
      error: "No Nimiq wallet address was provided.",
    };
  }

  if (!isValidNimiqAddress(cleanedAddress)) {
    return {
      balance: 0,
      found: false,
      error: "Invalid Nimiq wallet address.",
    };
  }

  try {
    const client = await getTestnetClient();

    const account = await client.getAccount(
      formatNimiqAddress(cleanedAddress)
    );

    if (!account) {
      return {
        balance: 0,
        found: false,
      };
    }

    const rawBalance = account.balance;

    if (
      rawBalance === undefined ||
      rawBalance === null
    ) {
      return {
        balance: 0,
        found: true,
      };
    }

    const balanceLuna = Number(rawBalance);

    if (!Number.isFinite(balanceLuna)) {
      throw new Error(
        "Invalid balance returned by the Nimiq Testnet Web Client."
      );
    }

    return {
      balance: lunaToNim(balanceLuna),
      balanceLuna,
      found: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "Failed to read Nimiq Testnet balance:",
      error
    );

    return {
      balance: 0,
      found: false,
      error:
        error?.message ||
        "Failed to read the Nimiq Testnet balance.",
    };
  }
}

/**
 * Simple balance getter.
 */
export async function fetchNimiqBalance(address) {
  const result = await fetchNimiqBalanceDetailed(address);

  return result.balance;
}

/**
 * Get the Nimiq Pay provider consensus status.
 */
export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());

  return Boolean(
    await nimiq.isConsensusEstablished()
  );
}

/**
 * Get the current Nimiq Pay block height.
 */
export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());

  return await nimiq.getBlockNumber();
}

/**
 * Get Testnet wallet information.
 *
 * Balance comes from the TestAlbatross Web Client.
 */
export async function getTestnetWalletInfo(provider) {
  const nimiq = provider || (await initNimiq());

  const address = await getNimiqAccount(nimiq);

  const [balanceInfo, consensus, blockNumber] =
    await Promise.all([
      fetchNimiqBalanceDetailed(address),
      getConsensusStatus(nimiq).catch(() => false),
      getBlockHeight(nimiq).catch(() => null),
    ]);

  return {
    address,
    balance: balanceInfo.balance,
    found: balanceInfo.found,
    balanceError: balanceInfo.error || null,

    consensus,
    blockNumber,

    // The Web Client is explicitly connected to TestAlbatross.
    network: "testnet",

    networkWarning: null,
  };
}

/**
 * Send NIM through Nimiq Pay.
 */
export async function sendNIMTransaction(
  provider,
  {
    recipient,
    valueInNim,
    data,
  }
) {
  const nimiq = provider || (await initNimiq());

  const providerRecipient =
    formatForProvider(recipient);

  const luna = nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error(
      "Transaction amount must be greater than 0 NIM."
    );
  }

  try {
    if (
      typeof data === "string" &&
      data.trim() &&
      typeof nimiq.sendBasicTransactionWithData ===
        "function"
    ) {
      return await nimiq.sendBasicTransactionWithData({
        recipient: providerRecipient,
        value: luna,
        data: data.trim(),
      });
    }

    if (
      typeof nimiq.sendBasicTransaction !==
      "function"
    ) {
      throw new Error(
        "Nimiq Pay does not provide the transaction method required by this app."
      );
    }

    return await nimiq.sendBasicTransaction({
      recipient: providerRecipient,
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
