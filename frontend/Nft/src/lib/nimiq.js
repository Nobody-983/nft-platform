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
 * The Nimiq Pay wallet controls its own network.
 * This function only initializes the wallet provider.
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
 * Initialize the Nimiq Web Client on TestAlbatross.
 *
 * This client is used for reading Testnet blockchain data,
 * such as account balances.
 *
 * It does NOT switch the Nimiq Pay wallet network.
 */
async function getTestnetClient() {
  if (coreClientPromise) {
    return coreClientPromise;
  }

  coreClientPromise = (async () => {
    try {
      await initCore();

      const config =
        new NimiqCore.ClientConfiguration();

      config.network("TestAlbatross");

      const client =
        await NimiqCore.Client.create(
          config.build()
        );

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
 * Compatibility alias.
 */
export const cleanNimiqAddress = cleanAddress;

/**
 * Check whether an address looks like a Nimiq address.
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
  const nimiq =
    provider || (await initNimiq());

  const accounts =
    await nimiq.listAccounts();

  if (
    !Array.isArray(accounts) ||
    accounts.length === 0
  ) {
    throw new Error(
      "No Nimiq wallet account is connected."
    );
  }

  const address = cleanAddress(accounts[0]);

  if (!isValidNimiqAddress(address)) {
    throw new Error(
      "Nimiq Pay returned an invalid wallet address."
    );
  }

  return address;
}

/**
 * Get every connected Nimiq account.
 */
export async function getNimiqAccounts(provider) {
  const nimiq =
    provider || (await initNimiq());

  const accounts =
    await nimiq.listAccounts();

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

  const parts =
    cleaned.match(/.{1,4}/g);

  return parts
    ? parts.join(" ")
    : cleaned;
}

/**
 * Prepare an address for Nimiq Pay.
 */
export function formatForProvider(address) {
  const cleaned = cleanAddress(address);

  if (!isValidNimiqAddress(cleaned)) {
    throw new Error(
      "Invalid Nimiq wallet address."
    );
  }

  return formatNimiqAddress(cleaned);
}

/**
 * Shorten a Nimiq address.
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
 * Compatibility alias.
 */
export const shortenNimiqAddress =
  shortenAddress;

/**
 * Convert NIM to Luna.
 */
export function nimToLuna(nim) {
  const numeric = Number(nim);

  if (
    !Number.isFinite(numeric) ||
    numeric < 0
  ) {
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

  if (
    !Number.isFinite(numeric) ||
    numeric < 0
  ) {
    return 0;
  }

  return (
    numeric / LUNA_PER_NIM
  );
}

/**
 * Format NIM for UI display.
 */
export function formatNim(
  nim,
  maximumFractionDigits = 5
) {
  const numeric = Number(nim);

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits,
    }
  ).format(numeric);
}

/**
 * Calculate maximum sendable NIM.
 */
export function getMaxSendableNim(
  balanceInNim,
  feeInLuna = DEFAULT_FEE_LUNA
) {
  const balanceLuna =
    nimToLuna(balanceInNim);

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
 * Fetch detailed Testnet balance.
 *
 * IMPORTANT:
 * Errors are returned instead of hidden.
 * This allows WalletContext/UI to display the
 * actual reason the balance failed.
 */
export async function fetchNimiqBalanceDetailed(
  address
) {
  const cleanedAddress =
    cleanAddress(address);

  if (!cleanedAddress) {
    return {
      balance: 0,
      balanceLuna: 0,
      found: false,
      error:
        "No Nimiq wallet address was provided.",
    };
  }

  if (!isValidNimiqAddress(cleanedAddress)) {
    return {
      balance: 0,
      balanceLuna: 0,
      found: false,
      error:
        "Invalid Nimiq wallet address.",
    };
  }

  try {
    const client =
      await getTestnetClient();

    const account =
      await client.getAccount(
        formatNimiqAddress(
          cleanedAddress
        )
      );

    if (!account) {
      return {
        balance: 0,
        balanceLuna: 0,
        found: false,
        error:
          "Nimiq Testnet account was not found.",
      };
    }

    const rawBalance =
      account.balance;

    if (
      rawBalance === undefined ||
      rawBalance === null
    ) {
      return {
        balance: 0,
        balanceLuna: 0,
        found: true,
        error:
          "Nimiq Testnet returned an account without a balance.",
      };
    }

    const balanceLuna =
      Number(rawBalance);

    if (!Number.isFinite(balanceLuna)) {
      throw new Error(
        "Invalid balance returned by the Nimiq Testnet Web Client."
      );
    }

    return {
      balance:
        lunaToNim(balanceLuna),

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
      balanceLuna: 0,
      found: false,

      // KEEP THE REAL ERROR.
      error:
        error?.message ||
        "Failed to read the Nimiq Testnet balance.",
    };
  }
}

/**
 * Simple balance getter.
 */
export async function fetchNimiqBalance(
  address
) {
  const result =
    await fetchNimiqBalanceDetailed(
      address
    );

  return result.balance;
}

/**
 * Check Nimiq Pay consensus.
 */
export async function getConsensusStatus(
  provider
) {
  const nimiq =
    provider || (await initNimiq());

  return Boolean(
    await nimiq.isConsensusEstablished()
  );
}

/**
 * Get Nimiq Pay block height.
 */
export async function getBlockHeight(
  provider
) {
  const nimiq =
    provider || (await initNimiq());

  return await nimiq.getBlockNumber();
}

/**
 * Get Testnet wallet information.
 *
 * Balance comes from the TestAlbatross
 * Web Client.
 */
export async function getTestnetWalletInfo(
  provider
) {
  const nimiq =
    provider || (await initNimiq());

  const address =
    await getNimiqAccount(nimiq);

  const [
    balanceInfo,
    consensus,
    blockNumber,
  ] = await Promise.all([
    fetchNimiqBalanceDetailed(
      address
    ),

    getConsensusStatus(
      nimiq
    ).catch(() => false),

    getBlockHeight(
      nimiq
    ).catch(() => null),
  ]);

  return {
    address,

    balance:
      balanceInfo.balance,

    balanceLuna:
      balanceInfo.balanceLuna,

    found:
      balanceInfo.found,

    balanceError:
      balanceInfo.error,

    consensus,

    blockNumber,

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
  const nimiq =
    provider || (await initNimiq());

  const providerRecipient =
    formatForProvider(
      recipient
    );

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
      data.trim() &&
      typeof nimiq.sendBasicTransactionWithData ===
        "function"
    ) {
      return await nimiq
        .sendBasicTransactionWithData({
          recipient:
            providerRecipient,
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

    return await nimiq
      .sendBasicTransaction({
        recipient:
          providerRecipient,
        value: luna,
      });
  } catch (error) {
    console.error(
      "NIM transaction failed:",
      error
    );

    const message =
      error?.message?.toLowerCase() ||
      "";

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
