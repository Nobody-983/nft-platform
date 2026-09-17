import { init } from "@nimiq/mini-app-sdk";
import initCore, * as NimiqCore from "@nimiq/core/web";

export const LUNA_PER_NIM = 100_000;
export const DEFAULT_FEE_LUNA = 100;

let cachedProvider = null;
let coreClientPromise = null;

/* =========================
NIMIQ PAY PROVIDER
========================= */

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

/* =========================
ADDRESS HELPERS
========================= */

export function cleanNimiqAddress(address) {
if (!address || typeof address !== "string") {
return "";
}

return address.replace(/\s+/g, "").toUpperCase();
}

export function isValidNimiqAddress(address) {
const cleaned = cleanNimiqAddress(address);

return /^NQ[0-9A-Z]{32}$/.test(cleaned);
}

export function formatNimiqAddress(address) {
const cleaned = cleanNimiqAddress(address);

if (!cleaned) {
return "";
}

return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
}

export function shortenNimiqAddress(address) {
if (!address) {
return "";
}

const cleaned = cleanNimiqAddress(address);

if (cleaned.length <= 12) {
return cleaned;
}

return `${cleaned.slice(0, 8)}...${cleaned.slice(-6)}`;
}

/* =========================
VALUE CONVERSION
========================= */

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

/* =========================
NIMIQ WEB CLIENT
========================= */

async function getCoreClient() {
if (!coreClientPromise) {
coreClientPromise = (async () => {
await initCore();


  const config = new NimiqCore.ClientConfiguration();

  // IMPORTANT:
  // This explicitly connects the read-only blockchain client
  // to Nimiq Testnet.
  config.network("TestAlbatross");

  const client = await NimiqCore.Client.create(config.build());

  await client.waitForConsensusEstablished();

  return client;
})();


}

return coreClientPromise;
}

/* =========================
ACCOUNT / BALANCE
========================= */

export async function getNimiqAccount(address) {
const cleanedAddress = cleanNimiqAddress(address);

if (!cleanedAddress) {
throw new Error("A Nimiq wallet address is required.");
}

const client = await getCoreClient();

return client.getAccount(cleanedAddress);
}

export async function fetchNimiqBalanceDetailed(address) {
const cleanedAddress = cleanNimiqAddress(address);

if (!cleanedAddress) {
return {
balance: 0,
found: false,
};
}

try {
const account = await getNimiqAccount(cleanedAddress);


return {
  balance: lunaToNim(account.balance),
  balanceLuna: Number(account.balance),
  found: true,
  account,
};


} catch (error) {
console.error("Failed to fetch Nimiq balance:", error);


return {
  balance: 0,
  found: false,
  error: error?.message || "Unable to fetch Nimiq balance.",
};


}
}

export async function fetchNimiqBalance(address) {
const result = await fetchNimiqBalanceDetailed(address);

return result.balance;
}

/* =========================
NETWORK STATUS
========================= */

export async function getConsensusStatus(provider) {
if (!provider) {
return false;
}

return Boolean(await provider.isConsensusEstablished());
}

export async function getBlockHeight(provider) {
if (!provider) {
return null;
}

const height = await provider.getBlockNumber();

return Number.isFinite(Number(height))
? Number(height)
: null;
}

export async function getTestnetWalletInfo(provider) {
if (!provider) {
throw new Error("Nimiq provider is not available.");
}

const accounts = await provider.listAccounts();

const address = accounts?.[0]?.trim();

if (!address) {
throw new Error("No Nimiq wallet account was selected.");
}

const [consensus, blockNumber, balanceInfo] = await Promise.all([
getConsensusStatus(provider),
getBlockHeight(provider),
fetchNimiqBalanceDetailed(address),
]);

return {
address,
consensus,
blockNumber,
balance: balanceInfo.balance,
balanceLuna: balanceInfo.balanceLuna ?? 0,
};
}

/* =========================
SEND TRANSACTION
========================= */

export async function sendNIMTransaction(
provider,
{ recipient, valueInNim, data = "" }
) {
if (!provider) {
throw new Error("Nimiq wallet provider is not available.");
}

const cleanedRecipient = recipient?.trim();

if (!cleanedRecipient) {
throw new Error("Recipient address is required.");
}

const value = nimToLuna(valueInNim);

if (!Number.isFinite(value) || value <= 0) {
throw new Error("Transaction amount must be greater than zero.");
}

if (typeof provider.sendBasicTransactionWithData === "function" && data) {
return provider.sendBasicTransactionWithData({
recipient: cleanedRecipient,
value,
data,
});
}

if (typeof provider.sendBasicTransaction === "function") {
return provider.sendBasicTransaction({
recipient: cleanedRecipient,
value,
});
}

throw new Error(
"The connected Nimiq Pay provider does not support basic NIM transactions."
);
}

/* =========================
SEND MAX
========================= */

export function getMaxSendableNim(balanceNim) {
const balanceLuna = nimToLuna(balanceNim);

const sendableLuna = Math.max(
0,
balanceLuna - DEFAULT_FEE_LUNA
);

return lunaToNim(sendableLuna);
}
