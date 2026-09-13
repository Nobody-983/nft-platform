import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// A conservative default network fee reserved when a UI wants to let a
// user "send max" without their transaction being rejected for having
// nothing left to cover the fee. This is a client-side safety margin,
// not a real fee estimate from the network — adjust if Nimiq Pay exposes
// fee estimation in a future SDK version.
export const DEFAULT_FEE_LUNA = 100; // 0.001 NIM

// This RPC is ONLY used for reading Testnet blockchain data.
// It does NOT switch Nimiq Pay to Testnet.
//
// IMPORTANT: verify which of these hostnames is actually reachable from
// your environment before relying on this in production. Community
// tooling (nimiq-rpc-client-ts) documents `rpc.nimiq-testnet.com`
// (no "pos." segment); older references use the "pos." form. Both are
// listed here and tried in order so a wrong first guess doesn't hard-fail
// the whole app — but you should confirm the correct one and trim this
// list once you know it.
export const TESTNET_RPC_CANDIDATES = [
  "https://rpc.nimiq-testnet.com",
  "https://rpc.pos.nimiq-testnet.com",
];

// Kept for backward compatibility with any code importing TESTNET_RPC
// directly. Points at the first candidate.
export const TESTNET_RPC = TESTNET_RPC_CANDIDATES[0];

// Once a candidate RPC responds successfully, remember it so we don't
// re-probe every call.
let resolvedTestnetRpc = null;

// A pending init() promise, not just the resolved provider. Using only
// a resolved-value cache (as the original code did) leaves a window
// where two calls that both race in before the first `init()` resolves
// end up calling `init()` twice. Caching the in-flight promise closes
// that window.
let providerPromise = null;

/**
 * Initialize the Nimiq Pay provider.
 *
 * IMPORTANT:
 * The wallet network is controlled by Nimiq Pay.
 *
 * To use Testnet:
 * Nimiq Pay -> Dev Menu -> Testnet
 *
 * The Mini App SDK does not switch the wallet network, and it does not
 * expose any way to ask which network the wallet is currently on. Any
 * "testnet" behavior in this file for account/balance reads comes from
 * a separate, always-testnet RPC endpoint (see TESTNET_RPC_CANDIDATES),
 * not from the provider itself. See `getTestnetWalletInfo` for the
 * mismatch check this implies.
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
      console.error("Failed to initialize Nimiq provider:", error);

      throw new Error(
        "Nimiq Pay provider is not available. Open this app inside Nimiq Pay.",
        { cause: error }
      );
    }
  })();

  try {
    return await providerPromise;
  } catch (error) {
    // Don't leave a rejected promise cached — allow retry on next call.
    providerPromise = null;
    throw error;
  }
}

/**
 * Clear cached provider.
 */
export function clearNimiqProvider() {
  providerPromise = null;
}

/**
 * Get the connected Nimiq account.
 *
 * This comes directly from Nimiq Pay, and reflects whatever network
 * Nimiq Pay is actually set to (mainnet or testnet) — NOT the network
 * of TESTNET_RPC_CANDIDATES. Calling this triggers a native approval
 * dialog every time; only call it in response to explicit user action
 * (e.g. a "Connect Wallet" tap), never automatically on page load.
 */
export async function getNimiqAccount(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  if (!accounts || accounts.length === 0) {
    throw new Error("No Nimiq wallet account is connected.");
  }

  return cleanAddress(accounts[0]);
}

/**
 * Get all connected Nimiq accounts.
 */
export async function getNimiqAccounts(provider) {
  const nimiq = provider || (await initNimiq());

  const accounts = await nimiq.listAccounts();

  return (accounts || []).map(cleanAddress);
}

/**
 * Clean a Nimiq address.
 */
export function cleanAddress(address) {
  if (!address) {
    return "";
  }

  return String(address).replace(/\s+/g, "").toUpperCase();
}

/**
 * Format a Nimiq address.
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
 * Shorten a Nimiq address.
 */
export function shortenAddress(address, leadingChars = 4, trailingChars = 4) {
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
 * Convert NIM to Luna.
 *
 * 1 NIM = 100,000 Luna.
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
 * The largest amount (in NIM) that's safe to offer as "Send Max" for a
 * given balance, reserving room for the network fee so the resulting
 * transaction doesn't get rejected for insufficient funds.
 */
export function getMaxSendableNim(balanceInNim, feeInLuna = DEFAULT_FEE_LUNA) {
  const balanceLuna = nimToLuna(balanceInNim);
  const maxLuna = balanceLuna - feeInLuna;

  if (maxLuna <= 0) {
    return 0;
  }

  return lunaToNim(maxLuna);
}

/**
 * Make a request to the Nimiq Testnet RPC.
 *
 * This is read-only blockchain access. It does NOT control the Nimiq
 * Pay wallet, and it is completely independent of whatever network
 * Nimiq Pay itself is set to.
 *
 * Tries each candidate endpoint in turn the first time, then sticks
 * with whichever one worked.
 */
async function testnetRpc(method, params = []) {
  const candidates = resolvedTestnetRpc
    ? [resolvedTestnetRpc]
    : TESTNET_RPC_CANDIDATES;

  let lastError = null;

  for (const endpoint of candidates) {
    try {
      const response = await fetch(endpoint, {
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
      });

      if (!response.ok) {
        throw new Error(`Nimiq Testnet RPC returned HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result?.error) {
        throw new Error(result.error.message || "Nimiq Testnet RPC error.");
      }

      // This endpoint works — remember it so future calls skip probing.
      resolvedTestnetRpc = endpoint;

      // IMPORTANT: Nimiq's Albatross (PoS) RPC wraps the actual payload
      // in an envelope: `result: { data: {...}, metadata: {...} }`.
      // The account/block/etc fields live under `.data`, NOT directly
      // on `result`. Reading `result.result.balance` (as earlier code
      // did) silently returns `undefined` for every call, which looks
      // exactly like "found the account but it has 0 balance" — a false
      // signal that wastes a lot of debugging time. Unwrap `.data` here
      // once, centrally, so every caller gets the real payload. Fall
      // back to the raw result for any future/older RPC method that
      // doesn't use the envelope.
      const payload = result?.result;

      if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
      }

      return payload;
    } catch (error) {
      lastError = error;
      console.warn(`Nimiq Testnet RPC candidate failed (${endpoint}):`, error?.message);
      // Try the next candidate.
    }
  }

  throw new Error(
    "Could not reach any Nimiq Testnet RPC endpoint. Check TESTNET_RPC_CANDIDATES.",
    { cause: lastError }
  );
}

/**
 * Get an account from the Nimiq Testnet blockchain.
 *
 * Returns `null` if the account genuinely doesn't exist on testnet yet
 * (e.g. it has never received funds). A `null` result here is NOT the
 * same thing as "confirmed zero balance" — see `fetchNimiqBalanceDetailed`.
 */
export async function getTestnetAccount(address) {
  const formatted = cleanAddress(address);

  if (!formatted) {
    throw new Error("No wallet address provided.");
  }

  const account = await testnetRpc("getAccountByAddress", [formatted]);

  return account || null;
}

/**
 * Get Testnet NIM balance, with detail on whether the account was
 * actually found on testnet. Use this instead of `fetchNimiqBalance`
 * when you need to tell "empty/new account" apart from "this address
 * doesn't exist on testnet, which usually means Nimiq Pay isn't
 * actually switched to Testnet right now."
 */
export async function fetchNimiqBalanceDetailed(address) {
  if (!address) {
    return { balance: 0, found: false };
  }

  const account = await getTestnetAccount(address);

  if (!account) {
    return { balance: 0, found: false };
  }

  const rawBalance = account.balance;

  if (rawBalance === undefined || rawBalance === null) {
    return { balance: 0, found: true };
  }

  const luna = Number(rawBalance);

  if (!Number.isFinite(luna)) {
    throw new Error(`Invalid Testnet balance: ${rawBalance}`);
  }

  return { balance: lunaToNim(luna), found: true };
}

/**
 * Get Testnet NIM balance.
 *
 * This reads the blockchain directly. Kept for backward compatibility —
 * prefer `fetchNimiqBalanceDetailed` in new code so you can distinguish
 * "zero balance" from "account/network mismatch."
 */
export async function fetchNimiqBalance(address) {
  const { balance } = await fetchNimiqBalanceDetailed(address);
  return balance;
}

/**
 * Get wallet information from Testnet, including a best-effort warning
 * if the connected wallet doesn't look like it's actually on testnet.
 *
 * The Mini App SDK has no `getNetwork()` method, so this can't be
 * verified with certainty. As a heuristic, we compare the provider's
 * own block height (whatever network Nimiq Pay is really on) against
 * the testnet RPC's block height. Nimiq mainnet and testnet are
 * separate chains that don't share block production, so if the two
 * heights are wildly different, Nimiq Pay is very likely not actually
 * in Testnet mode — even though the account lookup below might still
 * silently return "not found" and look like an empty wallet.
 */
export async function getTestnetWalletInfo(provider) {
  const nimiq = provider || (await initNimiq());

  const address = await getNimiqAccount(nimiq);

  const [{ balance, found }, providerBlockNumber] = await Promise.all([
    fetchNimiqBalanceDetailed(address),
    getBlockHeight(nimiq).catch(() => null),
  ]);

  let networkWarning = null;

  if (!found) {
    networkWarning =
      "This address was not found on Nimiq Testnet. If you expect a balance, " +
      "confirm Nimiq Pay is actually switched to Testnet (long-press the " +
      "settings button for 10s -> Dev Menu -> Testnet) rather than assuming " +
      "this is just an empty wallet.";
  }

  if (providerBlockNumber !== null && !found) {
    try {
      const testnetBlockNumber = await testnetRpc("getBlockNumber", []);

      if (
        typeof testnetBlockNumber === "number" &&
        Math.abs(testnetBlockNumber - providerBlockNumber) > 10_000
      ) {
        networkWarning =
          "Nimiq Pay's reported block height is very different from the " +
          "Testnet block height. Nimiq Pay is likely still on Mainnet — " +
          "switch it to Testnet via the Dev Menu before testing.";
      }
    } catch {
      // Best-effort only; ignore if this secondary check fails.
    }
  }

  return {
    address,
    balance,
    found,
    network: "testnet",
    networkWarning,
  };
}

/**
 * Check Nimiq consensus.
 *
 * This comes from the connected Nimiq Pay provider, so when Nimiq Pay
 * is in Testnet mode this represents Testnet consensus. No user
 * confirmation required — safe to call on mount/automatically.
 */
export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());

  return Boolean(await nimiq.isConsensusEstablished());
}

/**
 * Get current block height.
 *
 * This comes from the connected Nimiq Pay provider. No user
 * confirmation required — safe to call on mount/automatically.
 */
export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());

  return await nimiq.getBlockNumber();
}

/**
 * Send NIM through Nimiq Pay.
 *
 * IMPORTANT:
 * The network is controlled by Nimiq Pay.
 *
 * If Nimiq Pay is switched to Testnet, this transaction is a Testnet
 * transaction. Requires user confirmation — only call this in response
 * to an explicit user action (e.g. a "Send" button submit), never
 * automatically.
 */
export async function sendNIMTransaction(provider, { recipient, valueInNim, data }) {
  const nimiq = provider || (await initNimiq());

  const cleanRecipient = cleanAddress(recipient);

  if (!cleanRecipient || !cleanRecipient.startsWith("NQ")) {
    throw new Error("Invalid recipient Nimiq address.");
  }

  const luna = nimToLuna(valueInNim);

  if (luna <= 0) {
    throw new Error("Transaction amount must be greater than 0 NIM.");
  }

  try {
    if (data && data.trim()) {
      return await nimiq.sendBasicTransactionWithData({
        recipient: cleanRecipient,
        value: luna,
        data: data.trim(),
      });
    }

    return await nimiq.sendBasicTransaction({
      recipient: cleanRecipient,
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
      throw new Error("Transaction was rejected by the user.", { cause: error });
    }

    throw new Error(error?.message || "Failed to send NIM transaction.", {
      cause: error,
    });
  }
}
