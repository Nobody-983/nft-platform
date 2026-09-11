
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
  getNimiqAccount,
  fetchNimiqBalance,
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

  const [isConnected, setIsConnected] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [balance, setBalance] =
    useState(0);

  const [consensus, setConsensus] =
    useState(false);

  const [blockNumber, setBlockNumber] =
    useState(null);

  const [error, setError] =
    useState(null);

  // =====================================================
  // FETCH TESTNET BALANCE
  // =====================================================

  const refreshBalance = useCallback(
    async (targetAddress) => {
      if (!targetAddress) {
        setBalance(0);
        return 0;
      }

      try {
        const bal =
          await fetchNimiqBalance(
            targetAddress
          );

        setBalance(bal);

        return bal;
      } catch (err) {
        console.warn(
          "Error refreshing Testnet balance:",
          err
        );

        setBalance(0);

        return 0;
      }
    },
    []
  );

  // =====================================================
  // FETCH NIMIQ NETWORK STATUS
  // =====================================================

  const refreshNetwork = useCallback(
    async (provider) => {
      if (!provider) {
        return;
      }

      try {
        const isCons =
          await getConsensusStatus(
            provider
          );

        setConsensus(
          Boolean(isCons)
        );

        const height =
          await getBlockHeight(
            provider
          );

        if (height !== null) {
          setBlockNumber(height);
        }
      } catch (err) {
        console.warn(
          "Error refreshing network status:",
          err
        );
      }
    },
    []
  );

  // =====================================================
  // CONNECT TO NIMIQ PAY
  // =====================================================

  const connectWallet = useCallback(
    async () => {
      if (loading) {
        return null;
      }

      setLoading(true);
      setError(null);

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
            "Nimiq wallet provider could not be initialized."
          );
        }

        setNimiq(provider);

        // -----------------------------------------------
        // 2. Get the REAL wallet account
        // -----------------------------------------------

        const address =
          await getNimiqAccount(
            provider
          );

        if (!address) {
          throw new Error(
            "No Nimiq wallet account is connected."
          );
        }

        console.log(
          "Connected Nimiq wallet:",
          address
        );

        // -----------------------------------------------
        // 3. Store wallet connection
        // -----------------------------------------------

        setWalletAddress(address);
        setIsConnected(true);

        localStorage.setItem(
          "nimiq_wallet",
          address
        );

        // -----------------------------------------------
        // 4. Authenticate marketplace user
        // -----------------------------------------------

        const {
          user: authUser,
          profile: authProfile,
        } =
          await loginWithWallet(
            address
          );

        setUser(authUser);
        setProfile(authProfile);

        // -----------------------------------------------
        // 5. Get TESTNET balance
        // -----------------------------------------------

        await refreshBalance(
          address
        );

        // -----------------------------------------------
        // 6. Refresh network
        // -----------------------------------------------

        await refreshNetwork(
          provider
        );

        // -----------------------------------------------
        // 7. Go to dashboard
        // -----------------------------------------------

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return address;
      } catch (err) {
        console.error(
          "Nimiq wallet connection error:",
          err
        );

        const message =
          err?.message?.toLowerCase() ||
          "";

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

        setError(
          friendlyMessage
        );

        setWalletAddress(null);
        setIsConnected(false);
        setBalance(0);

        localStorage.removeItem(
          "nimiq_wallet"
        );

        throw new Error(
          friendlyMessage,
          {
            cause: err,
          }
        );
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      nimiq,
      navigate,
      refreshBalance,
      refreshNetwork,
    ]
  );

  // =====================================================
  // RESTORE SESSION
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        setIsInitializing(true);

        // -----------------------------------------------
        // Get Supabase session
        // -----------------------------------------------

        const {
          session,
          user: existingUser,
          profile: existingProfile,
        } =
          await getCurrentSession();

        if (!mounted) {
          return;
        }

        if (
          session &&
          existingUser
        ) {
          setUser(
            existingUser
          );

          setProfile(
            existingProfile
          );
        }

        // -----------------------------------------------
        // Try to initialize Nimiq Pay
        // -----------------------------------------------

        let provider = null;

        try {
          provider =
            await initNimiq({
              timeout: 4000,
            });
        } catch (providerError) {
          console.log(
            "Nimiq Pay is not available:",
            providerError?.message
          );
        }

        if (!mounted) {
          return;
        }

        if (provider) {
          setNimiq(provider);

          // ---------------------------------------------
          // IMPORTANT:
          // Do NOT trust localStorage as the wallet.
          //
          // Get the account directly from Nimiq Pay.
          // ---------------------------------------------

          try {
            const address =
              await getNimiqAccount(
                provider
              );

            if (
              address &&
              mounted
            ) {
              setWalletAddress(
                address
              );

              setIsConnected(
                true
              );

              localStorage.setItem(
                "nimiq_wallet",
                address
              );

              // -----------------------------------------
              // Fetch Testnet balance
              // -----------------------------------------

              await refreshBalance(
                address
              );

              // -----------------------------------------
              // Restore marketplace auth
              // -----------------------------------------

              if (
                !existingUser
              ) {
                try {
                  const {
                    user: restoredUser,
                    profile:
                      restoredProfile,
                  } =
                    await loginWithWallet(
                      address
                    );

                  if (mounted) {
                    setUser(
                      restoredUser
                    );

                    setProfile(
                      restoredProfile
                    );
                  }
                } catch (
                  authError
                ) {
                  console.warn(
                    "Could not restore marketplace session:",
                    authError
                  );
                }
              }
            }
          } catch (walletError) {
            console.log(
              "No active Nimiq wallet account:",
              walletError?.message
            );

            if (mounted) {
              setWalletAddress(
                null
              );

              setIsConnected(
                false
              );

              setBalance(0);

              localStorage.removeItem(
                "nimiq_wallet"
              );
            }
          }

          // ---------------------------------------------
          // Network information
          // ---------------------------------------------

          await refreshNetwork(
            provider
          );
        }
      } catch (err) {
        console.warn(
          "Session restore error:",
          err
        );
      } finally {
        if (mounted) {
          setIsInitializing(
            false
          );
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
  // GET CURRENT WALLET ADDRESS
  // =====================================================

  const getWalletAddress = useCallback(
    () => {
      return walletAddress;
    },
    [walletAddress]
  );

  // =====================================================
  // DISCONNECT WALLET
  // =====================================================

  const disconnectWallet =
    useCallback(
      async () => {
        setLoading(true);

        try {
          // ---------------------------------------------
          // Logout marketplace account
          // ---------------------------------------------

          try {
            await logoutUser();
          } catch (err) {
            console.warn(
              "Logout error:",
              err
            );
          }

          // ---------------------------------------------
          // Clear Nimiq provider cache
          // ---------------------------------------------

          clearNimiqProvider();

          // ---------------------------------------------
          // Clear local wallet state
          // ---------------------------------------------

          localStorage.removeItem(
            "nimiq_wallet"
          );

          setNimiq(null);
          setWalletAddress(null);
          setIsConnected(false);

          setUser(null);
          setProfile(null);

          setBalance(0);
          setConsensus(false);
          setBlockNumber(null);

          setError(null);

          // ---------------------------------------------
          // Return to wallet page
          // ---------------------------------------------

          navigate(
            "/login",
            {
              replace: true,
            }
          );
        } finally {
          setLoading(false);
        }
      },
      [navigate]
    );

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value = {
    // Provider
    nimiq,

    // Wallet
    walletAddress,
    isConnected,

    // State
    loading,
    isInitializing,
    error,

    // Supabase
    user,
    profile,

    // Testnet
    balance,
    consensus,
    blockNumber,

    // Actions
    connectWallet,
    getWalletAddress,
    disconnectWallet,

    // Refresh
    refreshBalance,
    refreshNetwork,
  };

  return (
    <WalletContext.Provider
      value={value}
    >
      {children}
    </WalletContext.Provider>
  );
}

// =======================================================
// HOOK
// =======================================================

export function useWallet() {
  const context =
    useContext(
      WalletContext
    );

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}
