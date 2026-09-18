import {
  createContext,
  useContext,
  useState,
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
  NIMIQ_NETWORK_LABEL,
  PAY_TESTNET_HINT,
} from "../lib/nimiq-network";

import {
  loginWithWallet,
  logoutUser,
} from "../services/auth";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const navigate = useNavigate();

  const [nimiq, setNimiq] = useState(null);
  const [walletAddress, setWalletAddress] =
    useState(null);

  const [isConnected, setIsConnected] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /*
   * We are no longer automatically
   * connecting the wallet on startup.
   */
  const [isInitializing, setIsInitializing] =
    useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] =
    useState(null);

  const [balance, setBalance] =
    useState(0);

  const [consensus, setConsensus] =
    useState(false);

  const [blockNumber, setBlockNumber] =
    useState(null);

  const [error, setError] =
    useState(null);

  const [balanceWarning, setBalanceWarning] =
    useState(null);

  // =====================================================
  // GET ADDRESS FROM NIMIQ PAY
  // =====================================================

  const getProviderAddress = useCallback(
    async (provider) => {
      if (!provider) {
        throw new Error(
          "Nimiq Pay wallet provider is not available."
        );
      }

      if (
        typeof provider.listAccounts !==
        "function"
      ) {
        throw new Error(
          "This version of Nimiq Pay does not support listAccounts()."
        );
      }

      const accounts =
        await provider.listAccounts();

      const address =
        accounts?.[0]?.trim();

      if (!address) {
        throw new Error(
          "No Nimiq wallet account is connected."
        );
      }

      return address;
    },
    []
  );

  // =====================================================
  // REFRESH BALANCE
  // =====================================================

  const refreshBalance = useCallback(
    async (targetAddress) => {
      if (!targetAddress) {
        setBalance(0);
        setBalanceWarning(null);
        return 0;
      }

      try {
        const result =
          await fetchNimiqBalanceDetailed(
            targetAddress
          );

        const nextBalance = Number(
          result?.balance ?? 0
        );

        setBalance(nextBalance);

        if (result?.found === false) {
          setBalanceWarning(
            result?.error ||
              "The wallet address could not be resolved on Nimiq Testnet. Confirm Nimiq Pay is switched to Testnet."
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
    },
    []
  );

  // =====================================================
  // REFRESH NETWORK
  // =====================================================

  const refreshNetwork = useCallback(
    async (provider) => {
      if (!provider) {
        return;
      }

      try {
        const established =
          await getConsensusStatus(
            provider
          );

        setConsensus(
          Boolean(established)
        );

        const height =
          await getBlockHeight(
            provider
          );

        if (
          height !== null &&
          height !== undefined
        ) {
          setBlockNumber(height);
        }
      } catch (err) {
        setBalanceWarning(
          err?.message ||
            "Unable to retrieve Nimiq Testnet network status."
        );
      }
    },
    []
  );

  // =====================================================
  // CONNECT WALLET
  // =====================================================

  const connectWallet = useCallback(
    async () => {
      if (loading) {
        return null;
      }

      setLoading(true);
      setError(null);
      setBalanceWarning(null);

      try {
        /*
         * THIS is the point where Nimiq Pay
         * is initialized.
         *
         * It only happens after the user
         * presses Connect Wallet.
         */
        const provider =
          await initNimiq({
            timeout: 10_000,
          });

        if (!provider) {
          throw new Error(
            "Nimiq Pay wallet provider could not be initialized."
          );
        }

        /*
         * Get the wallet account only after
         * the user starts the connection flow.
         */
        const address =
          await getProviderAddress(
            provider
          );

        /*
         * Wallet was successfully obtained.
         */
        setNimiq(provider);
        setWalletAddress(address);
        setIsConnected(true);

        /*
         * Now sign the user into the app.
         */
        const {
          user: authUser,
          profile: authProfile,
        } = await loginWithWallet(
          address
        );

        setUser(authUser);
        setProfile(authProfile);

        localStorage.setItem(
          "nimiq_wallet",
          address
        );

        /*
         * Connection/login is complete.
         */
        setLoading(false);

        navigate("/dashboard", {
          replace: true,
        });

        /*
         * These happen in the background.
         * They do not block wallet connection.
         */
        refreshBalance(address).catch(
          (err) => {
            setBalanceWarning(
              err?.message ||
                "Unable to retrieve the Nimiq Testnet wallet balance."
            );
          }
        );

        refreshNetwork(provider).catch(
          (err) => {
            setBalanceWarning(
              err?.message ||
                "Unable to retrieve the Nimiq Testnet network status."
            );
          }
        );

        return address;
      } catch (err) {
        console.error(
          "CONNECT WALLET ERROR:",
          err
        );

        const message =
          err?.message?.toLowerCase() ||
          "";

        let friendlyMessage =
          err?.message ||
          "Failed to connect Nimiq wallet. " + PAY_TESTNET_HINT;

        if (
          message.includes("reject") ||
          message.includes("cancel") ||
          message.includes("denied")
        ) {
          friendlyMessage =
            "Wallet connection was cancelled.";
        }

        /*
         * Make sure a failed/cancelled
         * connection does not leave the app
         * thinking the wallet is connected.
         */
        setNimiq(null);
        setWalletAddress(null);
        setIsConnected(false);

        setUser(null);
        setProfile(null);

        setBalance(0);
        setConsensus(false);
        setBlockNumber(null);

        setError(friendlyMessage);
        setBalanceWarning(
          friendlyMessage
        );

        localStorage.removeItem(
          "nimiq_wallet"
        );

        setLoading(false);

        return null;
      }
    },
    [
      loading,
      navigate,
      getProviderAddress,
      refreshBalance,
      refreshNetwork,
    ]
  );

  // =====================================================
  // DISCONNECT WALLET
  // =====================================================

  const disconnectWallet = useCallback(
    async () => {
      setLoading(true);

      try {
        try {
          await logoutUser();
        } catch (logoutError) {
          console.error(
            "LOGOUT ERROR:",
            logoutError
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
    },
    [navigate]
  );

  // =====================================================
  // GET WALLET ADDRESS
  // =====================================================

  const getWalletAddress = useCallback(
    () => walletAddress,
    [walletAddress]
  );

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

    networkLabel: NIMIQ_NETWORK_LABEL,
    networkHint: PAY_TESTNET_HINT,

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
  const context =
    useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}