import { init } from "@nimiq/mini-app-sdk";

export const LUNA_PER_NIM = 100_000;

// Small safety reserve when calculating "send max".
export const DEFAULT_FEE_LUNA = 100;

// Nimiq Testnet RPC endpoints.
export const TESTNET_RPC_CANDIDATES = [
"https://rpc.nimiq-testnet.com",
"https://rpc.pos.nimiq-testnet.com",
];

let resolvedTestnetRpc = null;
let providerPromise = null;

/**

* Initialize the Nimiq Pay provider.
*
* The app must be opened inside Nimiq Pay.
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
throw new Error("No Nimiq wallet account is connected.");
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
*
* Example:
* NQ00000000000000000000000000000000
*
* becomes:
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

* Convert NIM to Luna.
*
* 1 NIM = 100,000 Luna
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

* Perform a JSON-RPC request against Nimiq Testnet.
  */
  async function testnetRpc(method, params = []) {
  const endpoints = resolvedTestnetRpc
  ? [resolvedTestnetRpc]
  : TESTNET_RPC_CANDIDATES;

let lastError = null;

for (const endpoint of endpoints) {
try {
const response = await fetch(endpoint, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
jsonrpc: "2.0",
id: Date.now(),
method,
params,
}),
});


  if (!response.ok) {
    throw new Error(
      `Testnet RPC returned HTTP ${response.status}.`
    );
  }

  const json = await response.json();

  if (json?.error) {
    throw new Error(
      json.error.message || "Nimiq Testnet RPC error."
    );
  }

  resolvedTestnetRpc = endpoint;

  return json?.result;
} catch (error) {
  lastError = error;

  console.warn(
    `Testnet RPC failed: ${endpoint}`,
    error?.message
  );
}

}

throw new Error(
"Could not connect to any Nimiq Testnet RPC endpoint.",
{ cause: lastError }
);
}

/**

* Get an account from Nimiq Testnet.
  */
  export async function getTestnetAccount(address) {
  const cleanedAddress = cleanAddress(address);

if (!cleanedAddress) {
throw new Error("No wallet address provided.");
}

if (!isValidNimiqAddress(cleanedAddress)) {
throw new Error("Invalid Nimiq wallet address.");
}

return testnetRpc("getAccountByAddress", [
cleanedAddress,
]);
}

/**

* Get detailed Testnet balance information.
  */
  export async function fetchNimiqBalanceDetailed(address) {
  const cleanedAddress = cleanAddress(address);

if (!cleanedAddress) {
return {
balance: 0,
found: false,
};
}

try {
const account = await getTestnetAccount(cleanedAddress);


/*
 * An address can exist as a valid Nimiq address
 * without having an initialized account on-chain.
 */
if (!account) {
  return {
    balance: 0,
    found: true,
  };
}

const rawBalance = account.balance;

if (rawBalance === undefined || rawBalance === null) {
  return {
    balance: 0,
    found: true,
  };
}

const balanceLuna = Number(rawBalance);

if (!Number.isFinite(balanceLuna)) {
  throw new Error("Invalid balance returned by Testnet RPC.");
}

return {
  balance: lunaToNim(balanceLuna),
  found: true,
};


} catch (error) {
console.warn(
"Failed to read Nimiq Testnet balance:",
error
);


return {
  balance: 0,
  found: false,
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

* Check the wallet's Testnet information.
*
* The provider remains responsible for the actual wallet.
* The RPC is used only to read Testnet blockchain data.
  */
  export async function getTestnetWalletInfo(provider) {
  const nimiq = provider || (await initNimiq());

const address = await getNimiqAccount(nimiq);

const [balanceInfo, providerBlockNumber] =
await Promise.all([
fetchNimiqBalanceDetailed(address),


  getBlockHeight(nimiq).catch(() => null),
]);


let networkWarning = null;

/*

* Compare the wallet provider's chain height with
* the Testnet RPC height.
*
* This is only a diagnostic check.
  */
  if (providerBlockNumber !== null) {
  try {
  const testnetBlockNumber = await testnetRpc(
  "getBlockNumber"
  );

  if (
  typeof testnetBlockNumber === "number" &&
  Math.abs(
  testnetBlockNumber - providerBlockNumber
  ) > 10_000
  ) {
  networkWarning =
  "The Nimiq Pay provider appears to be on a different network than Testnet.";
  }
  } catch (error) {
  console.warn(
  "Could not compare provider and Testnet block heights:",
  error
  );
  }
  }

return {
address,
balance: balanceInfo.balance,
found: balanceInfo.found,
network: "testnet",
networkWarning,
};
}

/**

* Check whether the Nimiq provider has reached consensus.
  */
  export async function getConsensusStatus(provider) {
  const nimiq = provider || (await initNimiq());

return Boolean(
await nimiq.isConsensusEstablished()
);
}

/**

* Get the current block height from Nimiq Pay.
  */
  export async function getBlockHeight(provider) {
  const nimiq = provider || (await initNimiq());

return await nimiq.getBlockNumber();
}

/**

* Send NIM through Nimiq Pay.
*
* The actual transaction is signed/executed by the
* Nimiq Pay wallet provider.
  */
  export async function sendNIMTransaction(
  provider,
  { recipient, valueInNim, data }
  ) {
  const nimiq = provider || (await initNimiq());

const cleanRecipient = cleanAddress(recipient);

if (!isValidNimiqAddress(cleanRecipient)) {
throw new Error("Invalid recipient Nimiq address.");
}

const luna = nimToLuna(valueInNim);

if (luna <= 0) {
throw new Error(
"Transaction amount must be greater than 0 NIM."
);
}

try {
if (typeof data === "string" && data.trim()) {
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
