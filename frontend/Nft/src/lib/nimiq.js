
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// Nimiq Testnet / TestAlbatross RPC
export const TESTNET_RPC =
  "https://rpc.pos.nimiq-testnet.com";

let cachedProvider = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * IMPORTANT:
 * The Mini App SDK does not switch the wallet network.
 * The Nimiq Pay wallet itself must be running on Testnet.
 */
export async function initNimiq(
  options = { timeout: 10_000 }
) {
  if (cachedProvider) {
    return cachedProvider;
  }

  if (!isNimiqEnvironment()) {
    throw new Error(
      "Nimiq Pay is not available. Open this app inside Nimiq Pay."
    );
  }

  try {
    const provider = await init(options);

    if (!provider) {
      throw new Error(
        "Nimiq provider was not returned."
      );
    }

    cachedProvider = provider;

    return provider;
  } catch (error) {
    console.error(
      "Failed to initialize Nimiq provider:",
      error
    );

    throw new Error(
      "Nimiq Pay provider is not available. Make sure the app is opened inside Nimiq Pay.",
      { cause: error }
    );
  }
}

/**
 * Clear the cached provider.
 *
 * Useful when the wallet session changes.
 */
export function clearNimiqProvider() {
  cachedProvider = null;
}

/**
 * Check whether the app is running inside Nimiq Pay.
 */
export function isNimiqEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.nimiq ||
    window.nimiqPay
  );
}

/**
 * Get the currently connected Nimiq account.
 *
 * The returned address comes directly from Nimiq Pay.
 */
export async function getNimiqAccount(
  provider
) {
  const nimiq = provider || await initNimiq();

  const accounts =
    await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error(
      "No Nimiq wallet account is connected."
    );
  }

  return cleanAddress(accounts[0]);
}

/**
 * Get all connected Nimiq accounts.
 */
export async function getNimiqAccounts(
  provider
) {
  const nimiq = provider || await initNimiq();

  const accounts =
    await nimiq.listAccounts();

  return (accounts || []).map(cleanAddress);
}

/**
 * Format a Nimiq address.
 */
export function formatNimiqAddress(address) {
  if (!address) {
    return "";
  }

  const cleaned = cleanAddress(address);

  const parts =
    cleaned.match(/.{1,4}/g);

  return parts
    ? parts.join(" ")
    : cleaned;
}

/**
 * Shorten a Nimiq address.
 */
export function shortenAddress(
  address,
  leadingChars = 4,
  trailingChars = 4
) {
  if (!address) {
    return "";
  }

  const cleaned =
    cleanAddress(address);

  if (
    cleaned.length <=
    leadingChars + trailingChars
  ) {
    return cleaned;
  }

  return `${cleaned.slice(
    0,
    leadingChars
  )}...${cleaned.slice(
    -trailingChars
  )}`;
}

/**
 * Remove spaces and normalize address.
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
 * Convert NIM to Luna.
 *
 * 1 NIM = 100,000 Luna.
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

  return numeric / LUNA_PER_NIM;
}

/**
 * Make a JSON-RPC request to Nimiq Testnet.
 */
async function testnetRpc(
  method,
  params = []
) {
  const response = await fetch(
    TESTNET_RPC,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Nimiq Testnet RPC returned HTTP ${response.status}`
    );
  }

  const result =
    await response.json();

  if (result?.error) {
    throw new Error(
      result.error.message ||
        "Nimiq Testnet RPC error."
    );
  }

  return result?.result;
}

/**
 * Get an account directly from Nimiq Testnet.
 */
export async function getTestnetAccount(
  address
) {
  const formatted =
    cleanAddress(address);

  if (!formatted) {
    throw new Error(
      "No wallet address provided."
    );
  }

  try {
    const account =
      await testnetRpc(
        "getAccountByAddress",
        [formatted]
      );

    console.log(
      "========== NIMIQ TESTNET =========="
    );

    console.log(
      "Network: TestAlbatross"
    );

    console.log(
      "RPC:",
      TESTNET_RPC
    );

    console.log(
      "Wallet:",
      formatted
    );

    console.log(
      "Account:",
      account
    );

    console.log(
      "==================================="
    );

    return account || null;
  } catch (error) {
    console.error(
      "Failed to get Testnet account:",
      error
    );

    throw error;
  }
}

/**
 * Fetch the NIM balance from Testnet.
 *
 * This intentionally queries the Testnet RPC,
 * not a mainnet API.
 */
export async function fetchNimiqBalance(
  address
) {
  if (!address) {
    return 0;
  }

  const account =
    await getTestnetAccount(address);

  if (!account) {
    return 0;
  }

  const rawBalance =
    account.balance;

  if (
    rawBalance === undefined ||
    rawBalance === null
  ) {
    return 0;
  }

  const luna =
    Number(rawBalance);

  if (!Number.isFinite(luna)) {
    throw new Error(
      `Invalid Testnet balance: ${rawBalance}`
    );
  }

  return lunaToNim(luna);
}

/**
 * Get the wallet account and its Testnet balance.
 *
 * Useful for the Wallet page.
 */
export async function getTestnetWalletInfo(
  provider
) {
  const nimiq =
    provider || await initNimiq();

  const address =
    await getNimiqAccount(nimiq);

  const balance =
    await fetchNimiqBalance(address);

  return {
    address,
    balance,
    network: "testnet",
    rpc: TESTNET_RPC,
  };
}

/**
 * Check Nimiq consensus.
 */
export async function getConsensusStatus(
  provider
) {
  try {
    const nimiq =
      provider || await initNimiq();

    return Boolean(
      await nimiq.isConsensusEstablished()
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
 * Get current block height from the
 * connected Nimiq Pay provider.
 */
export async function getBlockHeight(
  provider
) {
  try {
    const nimiq =
      provider || await initNimiq();

    return await nimiq.getBlockNumber();
  } catch (error) {
    console.error(
      "Block height request failed:",
      error
    );

    return null;
  }
}

/**
 * Send NIM through the connected Nimiq Pay wallet.
 *
 * The wallet itself determines the active
 * Nimiq network. Make sure Nimiq Pay is in
 * Testnet mode before approving the transaction.
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
    provider || await initNimiq();

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
      "Transaction amount must be greater than 0 NIM."
    );
  }

  try {
    if (
      data &&
      data.trim()
    ) {
      return await nimiq
        .sendBasicTransactionWithData({
          recipient: cleanRecipient,
          value: luna,
          data: data.trim(),
        });
    }

    return await nimiq
      .sendBasicTransaction({
        recipient: cleanRecipient,
        value: luna,
      });
  } catch (error) {
    console.error(
      "NIM Testnet transaction failed:",
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
