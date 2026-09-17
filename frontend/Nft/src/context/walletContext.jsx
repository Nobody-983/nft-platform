
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

      // IMPORTANT:
      // Keep the actual Testnet/blockchain error so
      // Wallet.jsx can display it to the user.
      if (result?.found === false) {
        setBalanceWarning(
          result?.error ||
            "The wallet address could not be resolved by the Nimiq Testnet balance service."
        );
      } else {
        setBalanceWarning(null);
      }

      return nextBalance;
    } catch (err) {
      setBalance(0);

      setBalanceWarning(
        err?.message ||
          "Unable to retrieve the Nimiq Testnet wallet balance."
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
      const established =
        await getConsensusStatus(provider);

      setConsensus(Boolean(established));

      const height =
        await getBlockHeight(provider);

      if (
        height !== null &&
        height !== undefined
      ) {
        setBlockNumber(height);
      }
    } catch (err) {
      // Keep the network error visible instead of
      // silently losing it.
      setBalanceWarning(
        err?.message ||
          "Unable to retrieve the Nimiq Testnet network status."
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
    setBalanceWarning(null);

    try {
      // -----------------------------------------------
      // 1. Initialize Nimiq Pay
      // -----------------------------------------------

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

      // -----------------------------------------------
      // 2. Get wallet address
      // -----------------------------------------------

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

      const address =
        accounts[0]?.trim();

      if (!address) {
        throw new Error(
          "Nimiq Pay returned an empty wallet address."
        );
      }

      // -----------------------------------------------
      // 3. Store wallet state
      // -----------------------------------------------

      setWalletAddress(address);
      setIsConnected(true);

      localStorage.setItem(
        "nimiq_wallet",
        address
      );

      // -----------------------------------------------
      // 4. Authenticate with Supabase
      // -----------------------------------------------

      const {
        user: authUser,
        profile: authProfile,
      } = await loginWithWallet(address);

      setUser(authUser);
      setProfile(authProfile);

      // -----------------------------------------------
      // 5. Check Testnet balance BEFORE navigation
      // -----------------------------------------------

      await refreshBalance(address);

      // -----------------------------------------------
      // 6. Check Nimiq network status
      // -----------------------------------------------

      await refreshNetwork(provider);

      // -----------------------------------------------
      // 7. Navigate
      // -----------------------------------------------

      setLoading(false);

      navigate("/dashboard", {
        replace: true,
      });

      return address;
    } catch (err) {
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

      // IMPORTANT:
      // Do not erase balanceWarning here.
      // If the Testnet lookup already produced a useful
      // error, keep it visible to the user.
      if (!balanceWarning) {
        setBalanceWarning(friendlyMessage);
      }

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
    refreshBalance,
    refreshNetwork,
    balanceWarning,
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
          if (mounted) {
            setBalanceWarning(
              providerError?.message ||
                "Nimiq Pay could not be initialized."
            );
          }
        }

        if (!mounted || !provider) {
          return;
        }

        setNimiq(provider);

        try {
          const accounts =
            await provider.listAccounts();

          const address =
            accounts?.[0]?.trim();

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
        } catch (walletError) {
          if (mounted) {
            setBalanceWarning(
              walletError?.message ||
                "Unable to restore the Nimiq wallet."
            );
          }
        }

        await refreshNetwork(provider);
      } catch (err) {
        if (mounted) {
          setBalanceWarning(
            err?.message ||
              "Unable to restore the wallet session."
          );
        }
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
      } catch {
        // Logout failure should not prevent local
        // wallet state from being cleared.
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

{balanceWarning && (
  <div>
    {balanceWarning}
  </div>
)}
