
import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// This RPC is ONLY used for reading Testnet blockchain data.
// It does NOT switch Nimiq Pay to Testnet.
export const TESTNET_RPC =
  "https://rpc.pos.nimiq-testnet.com";

let cachedProvider = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * IMPORTANT:
 * The wallet network is controlled by Nimiq Pay.
 *
 * To use Testnet:
 * Nimiq Pay -> Dev Menu -> Testnet
 *
 * The Mini App SDK does not switch the wallet network.
 */
export async function initNimiq(
  options = { timeout: 10_000 }
) {
  if (cachedProvider) {
    return cachedProvider;
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
      "Nimiq Pay provider is not available. Open this app inside Nimiq Pay.",
      { cause: error }
    );
  }
}

/**
 * Clear cached provider.
 */
export function clearNimiqProvider() {
  cachedProvider = null;
}

/**
 * Get the connected Nimiq account.
 *
 * This comes directly from Nimiq Pay.
 */
export async function getNimiqAccount(provider) {
  const nimiq =
    provider || await initNimiq();

  const accounts =
    await nimiq.listAccounts();

  if (
    !accounts ||
    accounts.length === 0
  ) {
    throw new Error(
      "No Nimiq wallet account is connected."
    );
  }

  return cleanAddress(accounts[0]);
}

/**
 * Get all connected Nimiq accounts.
 */
export async function getNimiqAccounts(provider) {
  const nimiq =
    provider || await initNimiq();

  const accounts =
    await nimiq.listAccounts();

  return (accounts || []).map(
    cleanAddress
  );
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
 * Format a Nimiq address.
 */
export function formatNimiqAddress(address) {
  const cleaned =
    cleanAddress(address);

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
 * Shorten a Nimiq address.
 */
export function shortenAddress(
  address,
  leadingChars = 4,
  trailingChars = 4
) {
  const cleaned =
    cleanAddress(address);

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
  )}...${cleaned.slice(
    -trailingChars
  )}`;
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
 * Make a request to the Nimiq Testnet RPC.
 *
 * This is read-only blockchain access.
 * It does NOT control the Nimiq Pay wallet.
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
        "Content-Type":
          "application/json",
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
 * Get an account from the Nimiq Testnet blockchain.
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

  const account =
    await testnetRpc(
      "getAccountByAddress",
      [formatted]
    );

  return account || null;
}

/**
 * Get Testnet NIM balance.
 *
 * This reads the blockchain directly.
 */
export async function fetchNimiqBalance(
  address
) {
  if (!address) {
    return 0;
  }

  const account =
    await getTestnetAccount(
      address
    );

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
 * Get wallet information from Testnet.
 */
export async function getTestnetWalletInfo(
  provider
) {
  const nimiq =
    provider || await initNimiq();

  const address =
    await getNimiqAccount(
      nimiq
    );

  const balance =
    await fetchNimiqBalance(
      address
    );

  return {
    address,
    balance,
    network: "testnet",
  };
}

/**
 * Check Nimiq consensus.
 *
 * This comes from the connected Nimiq Pay
 * provider, so when Nimiq Pay is in Testnet
 * mode this represents Testnet consensus.
 */
export async function getConsensusStatus(
  provider
) {
  const nimiq =
    provider || await initNimiq();

  return Boolean(
    await nimiq.isConsensusEstablished()
  );
}

/**
 * Get current block height.
 *
 * This comes from the connected Nimiq Pay
 * provider.
 */
export async function getBlockHeight(
  provider
) {
  const nimiq =
    provider || await initNimiq();

  return await nimiq.getBlockNumber();
}

/**
 * Send NIM through Nimiq Pay.
 *
 * IMPORTANT:
 * The network is controlled by Nimiq Pay.
 *
 * If Nimiq Pay is switched to Testnet,
 * this transaction is a Testnet transaction.
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
          recipient:
            cleanRecipient,
          value: luna,
          data: data.trim(),
        });
    }

    return await nimiq
      .sendBasicTransaction({
        recipient:
          cleanRecipient,
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
      message.includes(
        "permission_denied"
      )
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
