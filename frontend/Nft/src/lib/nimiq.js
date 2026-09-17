
import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

export const LUNA_PER_NIM = 100_000;

// -----------------------------------------------------
// CONSTANTS
// -----------------------------------------------------

export const DEFAULT_FEE_LUNA = 100;

let cachedProvider = null;
let coreClientPromise = null;

// -----------------------------------------------------
// NIMIQ PAY PROVIDER
// -----------------------------------------------------

export async function initNimiq(options = {}) {
  if (cachedProvider) {
    return cachedProvider;
  }

  try {
    cachedProvider = await init(options);
    return cachedProvider;
  } catch (error) {
    cachedProvider = null;

    console.error(
      "Nimiq Pay provider initialization failed:",
      error
    );

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

// -----------------------------------------------------
// NIMIQ TESTNET WEB CLIENT
// -----------------------------------------------------

async function getTestnetClient() {
  if (coreClientPromise) {
    return coreClientPromise;
  }

  coreClientPromise = (async () => {
    try {
      await initCore();

      const config =
        new NimiqCore.ClientConfiguration();

      // IMPORTANT:
      // This is the Nimiq Web Client network used for
      // blockchain reads such as account balances.
      config.network("testalbatross");

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

      // Preserve the ORIGINAL error message so it can
      // be displayed by WalletContext.
      throw new Error(
        error?.message ||
          "Could not connect to the Nimiq Testnet blockchain.",
        { cause: error }
      );
    }
  })();

  return coreClientPromise;
}

// -----------------------------------------------------
// ADDRESS HELPERS
// -----------------------------------------------------

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

  try {
    const addressObject =
      NimiqCore.Address.fromString(cleaned);

    return Boolean(addressObject);
  } catch {
    return false;
  }
}

export function formatNimiqAddress(address) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  try {
    return NimiqCore.Address.fromString(
      cleaned
    ).toUserFriendlyAddress();
  } catch {
    return cleaned;
  }
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

// -----------------------------------------------------
// WALLET ACCOUNT
// -----------------------------------------------------

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

// -----------------------------------------------------
// NIM / LUNA CONVERSION
// -----------------------------------------------------

export function nimToLuna(value) {
  const nim = Number(value);

  if (!Number.isFinite(nim)) {
    throw new Error(
      "Invalid NIM amount."
    );
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
  const balanceLuna = nimToLuna(balance);

  const sendableLuna =
    Math.max(
      0,
      balanceLuna - DEFAULT_FEE_LUNA
    );

  return lunaToNim(sendableLuna);
}

// -----------------------------------------------------
// TESTNET BALANCE
// -----------------------------------------------------

export async function fetchNimiqBalanceDetailed(
  address
) {
  const cleanedAddress =
    cleanAddress(address);

  if (!cleanedAddress) {
    return {
      balance: 0,
      found: false,
      error:
        "A Nimiq wallet address is required.",
    };
  }

  try {
    const client =
      await getTestnetClient();

    const formattedAddress =
      formatNimiqAddress(
        cleanedAddress
      );

    if (!formattedAddress) {
      return {
        balance: 0,
        found: false,
        error:
          "The Nimiq wallet address is invalid.",
      };
    }

    const account =
      await client.getAccount(
        formattedAddress
      );

    if (!account) {
      return {
        balance: 0,
        found: false,
        error:
          "The wallet address could not be found on the Nimiq Testnet blockchain.",
      };
    }

    const balanceLuna =
      Number(account.balance ?? 0);

    return {
      balance:
        balanceLuna / LUNA_PER_NIM,

      found: true,

      error: null,
    };
  } catch (error) {
    console.error(
      "Nimiq Testnet balance lookup failed:",
      error
    );

    // IMPORTANT:
    // Return the REAL error instead of hiding it.
    // WalletContext reads result.error and displays it.
    return {
      balance: 0,
      found: false,
      error:
        error?.message ||
        "Unable to retrieve the Nimiq Testnet balance.",
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

// -----------------------------------------------------
// NETWORK STATUS
// -----------------------------------------------------

export async function getConsensusStatus(
  provider
) {
  if (!provider) {
    return false;
  }

  try {
    return Boolean(
      await provider.isConsensusEstablished()
    );
  } catch (error) {
    console.warn(
      "Could not retrieve Nimiq consensus status:",
      error
    );

    return false;
  }
}

export async function getBlockHeight(
  provider
) {
  if (!provider) {
    return null;
  }

  try {
    return await provider.getBlockNumber();
  } catch (error) {
    console.warn(
      "Could not retrieve Nimiq block number:",
      error
    );

    return null;
  }
}

// -----------------------------------------------------
// TESTNET WALLET INFORMATION
// -----------------------------------------------------

export async function getTestnetWalletInfo(
  address
) {
  const result =
    await fetchNimiqBalanceDetailed(
      address
    );

  return {
    address: cleanAddress(address),
    balance: result.balance,
    found: result.found,
    error: result.error,
    network: "testnet",
  };
}

// -----------------------------------------------------
// SEND NIM TRANSACTION
// -----------------------------------------------------

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
    console.error(
      "Nimiq Testnet transaction failed:",
      error
    );

    throw new Error(
      error?.message ||
        "The Nimiq Testnet transaction failed.",
      { cause: error }
    );
  }
}


catch (error) {
  return {
    balance: 0,
    found: false,
    error: error?.message ||
      "Unable to retrieve the Nimiq Testnet balance.",
  };
}
