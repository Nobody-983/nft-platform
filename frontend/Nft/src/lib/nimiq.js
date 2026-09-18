import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

import {
  NIMIQ_NETWORK_ID,
  PAY_TESTNET_HINT,
  TESTNET_SEED_NODES,
} from "./nimiq-network";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;
export const CONSENSUS_TIMEOUT_MS = 45_000;

let cachedProvider = null;
let coreClientPromise = null;

/**
 * Initialize Nimiq Pay.
 *
 * Transactions still require the wallet itself to be on Testnet.
 * The Mini App SDK cannot switch Nimiq Pay's network.
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

export function clearNimiqProvider() {
  cachedProvider = null;
}

function toClientAddress(cleanedAddress) {
  if (typeof NimiqCore.Address?.fromString === "function") {
    return NimiqCore.Address.fromString(cleanedAddress);
  }

  return cleanedAddress;
}

async function waitForTestnetConsensus(client) {
  if (typeof client.waitForConsensusEstablished !== "function") {
    return;
  }

  await Promise.race([
    client.waitForConsensusEstablished(),
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(
          new Error(
            "Timed out waiting for Nimiq Testnet consensus. This app does not use mainnet seed gateways."
          )
        );
      }, CONSENSUS_TIMEOUT_MS);
    }),
  ]);
}

/**
 * Light client pinned to TestAlbatross.
 *
 * seedNodes() replaces the bundled mainnet gateway list.
 * Without this override, @nimiq/core still dials aurora.seed.nimiq.com
 * and the other mainnet seeds even when network is testalbatross.
 */
async function getTestnetClient() {
  if (coreClientPromise) {
    return coreClientPromise;
  }

  coreClientPromise = (async () => {
    try {
      await initCore();

      const config = new NimiqCore.ClientConfiguration();
      config.network(NIMIQ_NETWORK_ID);
      config.seedNodes([...TESTNET_SEED_NODES]);
      config.logLevel("warn");

      const client = await NimiqCore.Client.create(config.build());
      await waitForTestnetConsensus(client);

      return client;
    } catch (error) {
      coreClientPromise = null;

      throw new Error(
        error?.message || "Could not connect to the Nimiq Testnet blockchain.",
        { cause: error }
      );
    }
  })();

  return coreClientPromise;
}

export function cleanAddress(address) {
  if (!address) {
    return "";
  }

  return String(address).trim().replace(/\s+/g, "").toUpperCase();
}

export const cleanNimiqAddress = cleanAddress;

export function isValidNimiqAddress(address) {
  return /^NQ[A-Z0-9]{32}$/.test(cleanAddress(address));
}

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

export function formatNimiqAddress(address) {
  return cleanAddress(address);
}

export function formatForProvider(address) {
  return cleanAddress(address);
}

export function shortenAddress(address, start = 8, end = 8) {
  const cleaned = cleanAddress(address);

  if (!cleaned) {
    return "";
  }

  if (cleaned.length <= start + end + 3) {
    return cleaned;
  }

  return `${cleaned.slice(0, start)}...${cleaned.slice(-end)}`;
}

export const shortenNimiqAddress = shortenAddress;

export function nimToLuna(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    throw new Error("Invalid NIM amount.");
  }

  return Math.round(value * LUNA_PER_NIM);
}

export function lunaToNim(luna) {
  const value = Number(luna);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value / LUNA_PER_NIM;
}

export function formatNim(luna, maximumFractionDigits = 5) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(lunaToNim(luna));
}

export function getMaxSendableNim(balanceLuna) {
  const balance = Number(balanceLuna);

  if (!Number.isFinite(balance) || balance <= DEFAULT_FEE_LUNA) {
    return 0;
  }

  return lunaToNim(balance - DEFAULT_FEE_LUNA);
}

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
    const account = await client.getAccount(toClientAddress(cleanedAddress));

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
    return {
      balance: 0,
      found: false,
      error:
        error?.message ||
        "Unable to read the wallet balance from Nimiq Testnet.",
    };
  }
}

export async function fetchNimiqBalance(targetAddress) {
  const result = await fetchNimiqBalanceDetailed(targetAddress);
  return result.balance;
}

export async function getConsensusStatus(provider) {
  if (!provider || typeof provider.isConsensusEstablished !== "function") {
    return false;
  }

  return provider.isConsensusEstablished();
}

export async function getBlockHeight(provider) {
  if (!provider || typeof provider.getBlockNumber !== "function") {
    return null;
  }

  return provider.getBlockNumber();
}

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
 * Send testnet NIM through Nimiq Pay.
 * The first argument must be the provider from init(), not an address.
 */
export async function sendNIMTransaction(
  provider,
  { recipient, valueInNim, data = null }
) {
  if (!provider) {
    throw new Error("Nimiq Pay provider is not available.");
  }

  if (typeof provider.sendBasicTransaction !== "function") {
    throw new Error(
      "This version of Nimiq Pay does not support NIM transactions."
    );
  }

  const cleanedRecipient = cleanAddress(recipient);

  if (!cleanedRecipient) {
    throw new Error("A recipient wallet address is required.");
  }

  const value = nimToLuna(valueInNim);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("The NIM amount must be greater than zero.");
  }

  const payload = {
    recipient: cleanedRecipient,
    value,
  };

  let result;

  try {
    if (
      data &&
      typeof provider.sendBasicTransactionWithData === "function"
    ) {
      result = await provider.sendBasicTransactionWithData({
        ...payload,
        data,
      });
    } else {
      result = await provider.sendBasicTransaction(payload);
    }
  } catch (error) {
    const message = error?.message || "Nimiq Pay transaction failed.";
    const lower = message.toLowerCase();

    if (
      lower.includes("mainnet") ||
      lower.includes("wrong network") ||
      lower.includes("network mismatch")
    ) {
      throw new Error(PAY_TESTNET_HINT, { cause: error });
    }

    throw new Error(message, { cause: error });
  }

  if (result?.error) {
    throw new Error(
      result.error?.message ||
        String(result.error) ||
        "Nimiq Pay rejected the transaction."
    );
  }

  if (typeof result === "string") {
    return result;
  }

  if (result?.hash) {
    return result.hash;
  }

  throw new Error(
    "Nimiq Pay transaction completed, but no transaction hash was returned."
  );
}
