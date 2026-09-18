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

      const address =
        await getProviderAddress(provider);

      setWalletAddress(address);
      setIsConnected(true);

      localStorage.setItem(
        "nimiq_wallet",
        address
      );

      const {
        user: authUser,
        profile: authProfile,
      } = await loginWithWallet(address);

      setUser(authUser);
      setProfile(authProfile);

      /*
       * Wallet connection must not wait for the
       * Testnet balance client.
       */
      setLoading(false);

      navigate("/dashboard", {
        replace: true,
      });

      /*
       * Testnet balance lookup runs separately.
       * Any error is displayed through balanceWarning.
       */
      refreshBalance(address).catch((err) => {
        setBalanceWarning(
          err?.message ||
            "Unable to retrieve the Nimiq Testnet wallet balance."
        );
      });

      /*
       * Network status also runs separately.
       */
      refreshNetwork(provider).catch((err) => {
        setBalanceWarning(
          err?.message ||
            "Unable to retrieve the Nimiq Testnet network status."
        );
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
      setBalanceWarning(friendlyMessage);

      localStorage.removeItem(
        "nimiq_wallet"
      );

      setLoading(false);

      return null;
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

            refreshBalance(address).catch(
              (err) => {
                if (mounted) {
                  setBalanceWarning(
                    err?.message ||
                      "Unable to retrieve the Nimiq Testnet wallet balance."
                  );
                }
              }
            );
          }
        } catch (walletError) {
          if (mounted) {
            setBalanceWarning(
              walletError?.message ||
                "Unable to restore the Nimiq wallet."
            );
          }
        }

        refreshNetwork(provider).catch(
          (err) => {
            if (mounted) {
              setBalanceWarning(
                err?.message ||
                  "Unable to retrieve the Nimiq Testnet network status."
              );
            }
          }
        );
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
      } catch {
        // Continue clearing local wallet state.
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
