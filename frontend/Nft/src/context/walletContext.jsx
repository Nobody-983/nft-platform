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

  // Surfaces WHY the balance is what it is, instead of only ever
  // showing a number. Distinguishes "confirmed zero" from "account not
  // found on testnet" (which usually means Nimiq Pay isn't actually on
  // Testnet right now) from "couldn't reach the RPC at all."
  const [balanceWarning, setBalanceWarning] =
    useState(null);

  // =====================================================
  // FETCH TESTNET BALANCE
  // =====================================================

  const refreshBalance = useCallback(
    async (targetAddress) => {
      if (!targetAddress) {
        setBalance(0);
        setBalanceWarning(null);
        return 0;
      }

      try {
        const { balance: bal, found } =
          await fetchNimiqBalanceDetailed(
            targetAddress
          );

        setBalance(bal);

        if (!found) {
          const warning =
            "This address wasn't found on Nimiq Testnet. " +
            "Check that Nimiq Pay is actually switched to Testnet " +
            "(long-press the settings button for 10s -> Dev Menu -> Testnet).";

          console.warn(
            "[wallet] balance is 0 because the account was NOT FOUND on testnet:",
            targetAddress
          );

          setBalanceWarning(warning);
        } else {
          setBalanceWarning(null);
        }

        return bal;
      } catch (err) {
        // This is a DIFFERENT failure mode from "not found" — the RPC
        // call itself blew up (network error, CORS, bad hostname, etc).
        // Log it loudly and distinctly so it isn't confused with a
        // genuinely empty wallet.
        console.error(
          "[wallet] Testnet RPC call FAILED (not just empty — an actual error):",
          err
        );

        setBalance(0);

        setBalanceWarning(
          `Couldn't reach the Nimiq Testnet RPC: ${
            err?.message || "unknown error"
          }`
        );

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
        setBalanceWarning(null);

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
        // Try to detect Nimiq Pay WITHOUT prompting the
        // user. listAccounts() requires confirmation, so
        // it must never run automatically on mount — only
        // use no-confirmation calls here.
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
          // Network information only (no confirmation
          // dialog). Do NOT call getNimiqAccount()/
          // listAccounts() here — that would pop a native
          // approval dialog on every page load with no
          // user interaction, which is exactly the kind
          // of silent-failure trap that made "testnet
          // isn't working" hard to diagnose in the first
          // place. Restoring a previously-connected wallet
          // now requires the user to tap "Connect" again;
          // there is no way around this with the current
          // SDK, since it exposes no "already granted?"
          // check.
          // ---------------------------------------------

          await refreshNetwork(
            provider
          );

          const storedAddress =
            localStorage.getItem(
              "nimiq_wallet"
            );

          if (storedAddress) {
            console.log(
              "A previously connected wallet was found locally, but re-confirming " +
              "with Nimiq Pay requires the user to tap Connect again."
            );
          }
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
          setBalanceWarning(null);
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
    balanceWarning,
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
