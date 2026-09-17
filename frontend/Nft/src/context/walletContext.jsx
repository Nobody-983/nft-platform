import {
createContext,
useContext,
useState,
useEffect,
useCallback,
} from "react";

import { useNavigate } from "react-router-dom";

import {
initNimiq,
fetchNimiqBalanceDetailed,
getConsensusStatus,
getBlockHeight,
clearNimiqProvider,
} from "../lib/nimiq";

import {
loginWithWallet,
logoutUser,
getCurrentSession,
} from "../services/auth";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
const navigate = useNavigate();

const [nimiq, setNimiq] = useState(null);
const [walletAddress, setWalletAddress] = useState(null);
const [isConnected, setIsConnected] = useState(false);

const [loading, setLoading] = useState(false);
const [isInitializing, setIsInitializing] = useState(true);

const [user, setUser] = useState(null);
const [profile, setProfile] = useState(null);

const [balance, setBalance] = useState(0);
const [consensus, setConsensus] = useState(false);
const [blockNumber, setBlockNumber] = useState(null);

const [error, setError] = useState(null);
const [balanceWarning, setBalanceWarning] = useState(null);

// =====================================================
// GET ADDRESS FROM NIMIQ PAY
// =====================================================

const getProviderAddress = useCallback(async (provider) => {
if (!provider) {
throw new Error(
"Nimiq Pay wallet provider is not available."
);
}


const accounts = await provider.listAccounts();

const address = accounts?.[0]?.trim();

if (!address) {
  throw new Error(
    "No Nimiq wallet account is connected."
  );
}

return address;


}, []);

// =====================================================
// REFRESH BALANCE
// =====================================================

const refreshBalance = useCallback(async (targetAddress) => {
if (!targetAddress) {
setBalance(0);
setBalanceWarning(null);
return 0;
}


try {
  const result =
    await fetchNimiqBalanceDetailed(targetAddress);

  const nextBalance = Number(
    result?.balance ?? 0
  );

  setBalance(nextBalance);

  if (result?.found === false) {
    setBalanceWarning(
      result?.error ||
        "The wallet address could not be resolved by the balance service."
    );
  } else {
    setBalanceWarning(null);
  }

  return nextBalance;
} catch (err) {
  console.error(
    "[wallet] Balance lookup failed:",
    err
  );

  setBalance(0);

  setBalanceWarning(
    err?.message ||
      "Unable to retrieve the wallet balance."
  );

  return 0;
}


}, []);

// =====================================================
// REFRESH NETWORK
// =====================================================

const refreshNetwork = useCallback(async (provider) => {
if (!provider) return;


try {
  const isConsistent =
    await getConsensusStatus(provider);

  setConsensus(Boolean(isConsistent));

  const height =
    await getBlockHeight(provider);

  if (
    height !== null &&
    height !== undefined
  ) {
    setBlockNumber(height);
  }
} catch (err) {
  console.warn(
    "[wallet] Network status failed:",
    err
  );
}


}, []);

// =====================================================
// CONNECT WALLET
// =====================================================

const connectWallet = useCallback(async () => {
if (loading) return null;


setLoading(true);
setError(null);

try {
  const provider =
    nimiq ||
    (await initNimiq({
      timeout: 10_000,
    }));

  if (!provider) {
    throw new Error(
      "Nimiq Pay wallet provider could not be initialized."
    );
  }

  setNimiq(provider);

  /*
   * IMPORTANT:
   * The address comes from Nimiq Pay's provider.
   * We do not pass the provider into getNimiqAccount().
   */
  const address =
    await getProviderAddress(provider);

  setWalletAddress(address);
  setIsConnected(true);

  localStorage.setItem(
    "nimiq_wallet",
    address
  );

  // Authenticate the wallet address with Supabase.
  const {
    user: authUser,
    profile: authProfile,
  } = await loginWithWallet(address);

  setUser(authUser);
  setProfile(authProfile);

  // Read blockchain data after the address exists.
  await refreshBalance(address);
  await refreshNetwork(provider);

  navigate("/dashboard", {
    replace: true,
  });

  return address;
} catch (err) {
  console.error(
    "[wallet] Nimiq connection failed:",
    err
  );

  const message =
    err?.message?.toLowerCase() || "";

  let friendlyMessage =
    err?.message ||
    "Failed to connect Nimiq wallet.";

  if (
    message.includes("reject") ||
    message.includes("cancel") ||
    message.includes("denied")
  ) {
    friendlyMessage =
      "Wallet connection was cancelled.";
  }

  setError(friendlyMessage);

  setNimiq(null);
  setWalletAddress(null);
  setIsConnected(false);

  setBalance(0);
  setBalanceWarning(null);

  localStorage.removeItem(
    "nimiq_wallet"
  );

  throw new Error(friendlyMessage, {
    cause: err,
  });
} finally {
  setLoading(false);
}


}, [
loading,
nimiq,
navigate,
getProviderAddress,
refreshBalance,
refreshNetwork,
]);

// =====================================================
// RESTORE SESSION
// =====================================================

useEffect(() => {
let mounted = true;


async function restoreSession() {
  try {
    setIsInitializing(true);

    const {
      session,
      user: existingUser,
      profile: existingProfile,
    } = await getCurrentSession();

    if (!mounted) return;

    if (session && existingUser) {
      setUser(existingUser);
      setProfile(existingProfile);
    }

    let provider = null;

    try {
      provider = await initNimiq({
        timeout: 4_000,
      });
    } catch (providerError) {
      console.log(
        "[wallet] Nimiq Pay unavailable:",
        providerError?.message
      );
    }

    if (!mounted) return;

    if (provider) {
      setNimiq(provider);

      /*
       * Get the actual wallet address from
       * Nimiq Pay, not from the blockchain
       * balance client.
       */
      const address =
        await getProviderAddress(provider);

      if (!mounted) return;

      if (address) {
        setWalletAddress(address);
        setIsConnected(true);

        localStorage.setItem(
          "nimiq_wallet",
          address
        );

        await refreshBalance(address);
      }

      await refreshNetwork(provider);
    }
  } catch (err) {
    console.warn(
      "[wallet] Session restore failed:",
      err
    );
  } finally {
    if (mounted) {
      setIsInitializing(false);
    }
  }
}

restoreSession();

return () => {
  mounted = false;
};


}, [
getProviderAddress,
refreshBalance,
refreshNetwork,
]);

// =====================================================
// GET WALLET ADDRESS
// =====================================================

const getWalletAddress = useCallback(
() => walletAddress,
[walletAddress]
);

// =====================================================
// DISCONNECT WALLET
// =====================================================

const disconnectWallet = useCallback(async () => {
setLoading(true);


try {
  try {
    await logoutUser();
  } catch (err) {
    console.warn(
      "[wallet] Logout failed:",
      err
    );
  }

  clearNimiqProvider();

  localStorage.removeItem(
    "nimiq_wallet"
  );

  setNimiq(null);
  setWalletAddress(null);
  setIsConnected(false);

  setUser(null);
  setProfile(null);

  setBalance(0);
  setBalanceWarning(null);

  setConsensus(false);
  setBlockNumber(null);

  setError(null);

  navigate("/login", {
    replace: true,
  });
} finally {
  setLoading(false);
}


}, [navigate]);

// =====================================================
// CONTEXT VALUE
// =====================================================

const value = {
nimiq,


walletAddress,
isConnected,

loading,
isInitializing,

user,
profile,

balance,
balanceWarning,

consensus,
blockNumber,

error,

connectWallet,
disconnectWallet,

getWalletAddress,

refreshBalance,
refreshNetwork,


};

return (
<WalletContext.Provider value={value}>
{children}
</WalletContext.Provider>
);
}

// =====================================================
// HOOK
// =====================================================

export function useWallet() {
const context = useContext(WalletContext);

if (!context) {
throw new Error(
"useWallet must be used inside WalletProvider"
);
}

return context;
}
