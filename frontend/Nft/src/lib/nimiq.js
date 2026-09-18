import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

// Nimiq Testnet RPC
const RPC_URL = "https://rpc.testnet.nimiq.network";

let cachedProvider = null;

// =====================================================
// NIMIQ PAY PROVIDER
// =====================================================

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
      error?.message ||
        "Could not connect to the Nimiq Pay wallet.",
      { cause: error }
    );
  }
}

export function clearNimiqProvider() {
  cachedProvider = null;
}

// =====================================================
// ADDRESS HELPERS
// =====================================================

export function cleanAddress(address) {
  if (!address || typeof address !== "string") {
    return "";
  }

  return address
    .trim()
    .replace(/\s+/g, "");
}

export const cleanNimiqAddress = cleanAddress;

export function isValidNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return false;
  }

  // Nimiq user-friendly addresses start with NQ
  return /^NQ[A-Z0-9]+$/.test(cleaned);
}

export function formatNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  return cleaned;
}

export function formatForProvider(address) {
  return formatNimiqAddress(address);
}

export function shortenAddress(
  address,
  start = 6,
  end = 6
) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  if (
    cleaned.length <=
    start + end + 3
  ) {
    return cleaned;
  }

  return `${cleaned.slice(
    0,
    start
  )}...${cleaned.slice(-end)}`;
}

export const shortenNimiqAddress =
  shortenAddress;

// =====================================================
// WALLET ACCOUNT
// =====================================================

export async function getNimiqAccount(
  provider
) {
  if (!provider) {
    throw new Error(
      "Nimiq Pay wallet provider is not available."
    );
  }

  const accounts =
    await provider.listAccounts();

  if (
    !Array.isArray(accounts) ||
    accounts.length === 0
  ) {
    throw new Error(
      "No Nimiq wallet account is connected."
    );
  }

  const address = accounts[0];

  if (
    !address ||
    typeof address !== "string"
  ) {
    throw new Error(
      "Nimiq Pay returned an invalid wallet address."
    );
  }

  return address.trim();
}

export async function getNimiqAccounts(
  provider
) {
  if (!provider) {
    throw new Error(
      "Nimiq Pay wallet provider is not available."
    );
  }

  const accounts =
    await provider.listAccounts();

  if (!Array.isArray(accounts)) {
    throw new Error(
      "Nimiq Pay returned an invalid account list."
    );
  }

  return accounts;
}

// =====================================================
// NIM / LUNA CONVERSION
// =====================================================

export function nimToLuna(value) {
  const nim = Number(value);

  if (!Number.isFinite(nim)) {
    throw new Error("Invalid NIM amount.");
  }

  return Math.round(
    nim * LUNA_PER_NIM
  );
}

export function lunaToNim(value) {
  const luna = Number(value);

  if (!Number.isFinite(luna)) {
    return 0;
  }

  return luna / LUNA_PER_NIM;
}

export function formatNim(value) {
  return lunaToNim(value).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    }
  );
}

export function getMaxSendableNim(
  balance
) {
  const balanceLuna =
    nimToLuna(balance);

  const sendableLuna = Math.max(
    0,
    balanceLuna - DEFAULT_FEE_LUNA
  );

  return lunaToNim(sendableLuna);
}

// =====================================================
// TESTNET BALANCE
// =====================================================

export async function fetchNimiqBalanceDetailed(
  targetAddress
) {
  const cleanTarget =
    cleanAddress(targetAddress);

  if (!cleanTarget) {
    return {
      balance: 0,
      found: false,
      error:
        "A Nimiq wallet address is required.",
    };
  }

  try {
    const response = await fetch(
      RPC_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method:
            "getAccountByAddress",
          params: [cleanTarget],
          id: 1,
        }),
      }
    );

    if (!response.ok) {
      return {
        balance: 0,
        found: false,
        error:
          `Nimiq Testnet RPC returned HTTP ${response.status}.`,
      };
    }

    const payload =
      await response.json();

    // Preserve the actual RPC error.
    if (payload?.error) {
      const rpcMessage =
        payload.error.message ||
        payload.error.data ||
        "The Nimiq Testnet RPC returned an error.";

      return {
        balance: 0,
        found: false,
        error: String(rpcMessage),
      };
    }

    if (!payload?.result) {
      return {
        balance: 0,
        found: false,
        error:
          "The wallet address could not be found on the Nimiq Testnet blockchain.",
      };
    }

    const lunaBalance =
      Number(
        payload.result.balance ?? 0
      );

    if (!Number.isFinite(lunaBalance)) {
      return {
        balance: 0,
        found: false,
        error:
          "The Nimiq Testnet returned an invalid balance.",
      };
    }

    return {
      balance:
        lunaBalance / LUNA_PER_NIM,
      found: true,
      error: null,
    };
  } catch (error) {
    return {
      balance: 0,
      found: false,
      error:
        error?.message ||
        "Unable to connect to the Nimiq Testnet RPC.",
    };
  }
}

export async function fetchNimiqBalance(
  address
) {
  const result =
    await fetchNimiqBalanceDetailed(
      address
    );

  return result.balance;
}

// =====================================================
// NETWORK STATUS
// =====================================================

export async function getConsensusStatus(
  provider
) {
  if (!provider) {
    return false;
  }

  try {
    if (
      typeof provider.isConsensusEstablished ===
      "function"
    ) {
      return Boolean(
        await provider.isConsensusEstablished()
      );
    }

    return false;
  } catch {
    return false;
  }
}

export async function getBlockHeight(
  provider
) {
  try {
    // The provider is the source of wallet/network state.
    if (
      provider &&
      typeof provider.getBlockNumber ===
        "function"
    ) {
      return await provider.getBlockNumber();
    }

    // Fallback to the Testnet RPC only for
    // blockchain information.
    const response = await fetch(
      RPC_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getBlockNumber",
          params: [],
          id: 1,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload =
      await response.json();

    return payload?.result ?? null;
  } catch {
    return null;
  }
}

// =====================================================
// TESTNET WALLET INFORMATION
// =====================================================

export async function getTestnetWalletInfo(
  address
) {
  const result =
    await fetchNimiqBalanceDetailed(
      address
    );

  return {
    address:
      cleanAddress(address),
    balance:
      result.balance,
    found:
      result.found,
    error:
      result.error,
    network: "testnet",
  };
}

// =====================================================
// SEND NIM TRANSACTION
// =====================================================

export async function sendNIMTransaction(
  provider,
  {
    recipient,
    valueInNim,
    data = "",
  } = {}
) {
  if (!provider) {
    throw new Error(
      "Nimiq Pay wallet provider is not available."
    );
  }

  const cleanRecipient =
    cleanAddress(recipient);

  if (!cleanRecipient) {
    throw new Error(
      "A recipient Nimiq address is required."
    );
  }

  const value =
    nimToLuna(valueInNim);

  if (value <= 0) {
    throw new Error(
      "The transaction amount must be greater than 0 NIM."
    );
  }

  try {
    if (
      data &&
      typeof provider.sendBasicTransactionWithData ===
        "function"
    ) {
      return await provider.sendBasicTransactionWithData(
        {
          recipient:
            formatNimiqAddress(
              cleanRecipient
            ),
          value,
          data,
        }
      );
    }

    if (
      typeof provider.sendBasicTransaction ===
      "function"
    ) {
      return await provider.sendBasicTransaction(
        {
          recipient:
            formatNimiqAddress(
              cleanRecipient
            ),
          value,
        }
      );
    }

    throw new Error(
      "The connected Nimiq Pay provider does not support NIM transactions."
    );
  } catch (error) {
    throw new Error(
      error?.message ||
        "The Nimiq Testnet transaction failed.",
      { cause: error }
    );
  }
}
