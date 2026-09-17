import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

let cachedProvider = null;
let coreClientPromise = null;

// =====================================================
// NIMIQ PAY PROVIDER
// =====================================================

export async function initNimiq(options = {}) {
if (cachedProvider) {
return cachedProvider;
}

const provider = await init(options);

cachedProvider = provider;

return provider;
}

export function clearNimiqProvider() {
cachedProvider = null;
}

// =====================================================
// GET ACCOUNT FROM NIMIQ PAY
// =====================================================

export async function getNimiqAccount(provider) {
if (!provider) {
throw new Error(
"Nimiq Pay wallet provider is not available."
);
}

const accounts = await provider.listAccounts();

if (!Array.isArray(accounts) || accounts.length === 0) {
throw new Error(
"No Nimiq wallet account is connected."
);
}

const address = accounts[0];

if (!address || typeof address !== "string") {
throw new Error(
"Nimiq Pay returned an invalid wallet address."
);
}

return address.trim();
}

// =====================================================
// ADDRESS HELPERS
// =====================================================

export function cleanNimiqAddress(address) {
if (!address || typeof address !== "string") {
return "";
}

return address.replace(/\s+/g, "").toUpperCase();
}

export function formatNimiqAddress(address) {
const cleaned = cleanNimiqAddress(address);

if (!cleaned) {
return "";
}

return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
}

export function shortenNimiqAddress(address) {
const cleaned = cleanNimiqAddress(address);

if (!cleaned) {
return "";
}

if (cleaned.length <= 12) {
return cleaned;
}

return `${cleaned.slice(0, 8)}...${cleaned.slice(-6)}`;
}

// Keep compatibility with the existing wallet.jsx imports.
export const cleanAddress = cleanNimiqAddress;
export const shortenAddress = shortenNimiqAddress;

// =====================================================
// VALUE CONVERSION
// =====================================================

export function nimToLuna(value) {
const nim = Number(value);

if (!Number.isFinite(nim)) {
return 0;
}

return Math.round(nim * LUNA_PER_NIM);
}

export function lunaToNim(value) {
const luna = Number(value);

if (!Number.isFinite(luna)) {
return 0;
}

return luna / LUNA_PER_NIM;
}

export function formatNim(value) {
const nim = Number(value);

if (!Number.isFinite(nim)) {
return "0.00";
}

return nim.toFixed(2);
}

// =====================================================
// NIMIQ WEB CLIENT
// =====================================================

async function getCoreClient() {
if (!coreClientPromise) {
coreClientPromise = (async () => {
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
})();


}

return coreClientPromise;
}

// =====================================================
// ACCOUNT / BALANCE
// =====================================================

export async function fetchNimiqBalanceDetailed(
address
) {
const cleanedAddress =
cleanNimiqAddress(address);

if (!cleanedAddress) {
return {
balance: 0,
balanceLuna: 0,
found: false,
error: "A Nimiq wallet address is required.",
};
}

try {
const client = await getCoreClient();


const account =
  await client.getAccount(
    cleanedAddress
  );

if (!account) {
  return {
    balance: 0,
    balanceLuna: 0,
    found: false,
  };
}

const balanceLuna =
  Number(account.balance ?? 0);

return {
  balance: lunaToNim(balanceLuna),
  balanceLuna,
  found: true,
  account,
};


} catch (error) {
console.error(
"[nimiq] Balance lookup failed:",
error
);


return {
  balance: 0,
  balanceLuna: 0,
  found: false,
  error:
    error?.message ||
    "Unable to retrieve the Nimiq balance.",
};


}
}

export async function fetchNimiqBalance(
address
) {
const result =
await fetchNimiqBalanceDetailed(address);

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
return Boolean(
await provider.isConsensusEstablished()
);
} catch (error) {
console.warn(
"[nimiq] Consensus check failed:",
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
const height =
await provider.getBlockNumber();


const number = Number(height);

return Number.isFinite(number)
  ? number
  : null;


} catch (error) {
console.warn(
"[nimiq] Block number check failed:",
error
);


return null;


}
}

// =====================================================
// WALLET INFO
// =====================================================

export async function getTestnetWalletInfo(
provider
) {
const address =
await getNimiqAccount(provider);

const [consensus, blockNumber] =
await Promise.all([
getConsensusStatus(provider),
getBlockHeight(provider),
]);

return {
address,
consensus,
blockNumber,
};
}

// =====================================================
// SEND TRANSACTION
// =====================================================

export async function sendNIMTransaction(
provider,
{
recipient,
valueInNim,
data = "",
}
) {
if (!provider) {
throw new Error(
"Nimiq wallet provider is not available."
);
}

const cleanedRecipient =
recipient?.trim();

if (!cleanedRecipient) {
throw new Error(
"Recipient address is required."
);
}

const value =
nimToLuna(valueInNim);

if (!Number.isFinite(value) || value <= 0) {
throw new Error(
"Transaction amount must be greater than zero."
);
}

if (
data &&
typeof provider.sendBasicTransactionWithData ===
"function"
) {
return provider.sendBasicTransactionWithData({
recipient: cleanedRecipient,
value,
data,
});
}

if (
typeof provider.sendBasicTransaction ===
"function"
) {
return provider.sendBasicTransaction({
recipient: cleanedRecipient,
value,
});
}

throw new Error(
"The connected Nimiq Pay provider does not support basic NIM transactions."
);
}

// =====================================================
// SEND MAX
// =====================================================

export function getMaxSendableNim(
balanceNim
) {
const balanceLuna =
nimToLuna(balanceNim);

const sendableLuna = Math.max(
0,
balanceLuna - DEFAULT_FEE_LUNA
);

return lunaToNim(sendableLuna);
}
