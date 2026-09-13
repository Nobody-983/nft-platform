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
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [balance, setBalance] = useState(0);
  const [consensus, setConsensus] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);
  const [error, setError] = useState(null);

  // Surfaces diagnostic warnings when the account is unindexed or unreachable
  const [balanceWarning, setBalanceWarning] = useState(null);

  // =====================================================
  // FETCH BALANCE & HANDLE WARNINGS
  // =====================================================

  const refreshBalance = useCallback(async (targetAddress) => {
    if (!targetAddress) {
      setBalance(0);
      setBalanceWarning(null);
      return 0;
    }

    try {
      const { balance: bal, found } = await fetchNimiqBalanceDetailed(
        targetAddress
      );

      setBalance(bal || 0);

      if (!found) {
        const warning =
          "This address was not found on the RPC node. " +
          "If this is a new wallet on Mainnet/Testnet, you need to receive funds first, " +
          "or check that Nimiq Pay is on the correct network.";

        console.warn(
          "[wallet] Account not found on RPC node:",
          targetAddress
        );

        setBalanceWarning(warning);
      } else {
        setBalanceWarning(null);
      }

      return bal || 0;
    } catch (err) {
      console.error("[wallet] RPC call FAILED:", err);

      setBalance(0);
      setBalanceWarning(
        `Couldn't reach the Nimiq RPC endpoint: ${
          err?.message || "unknown network error"
        }`
      );

      return 0;
    }
  }, []);

  // =====================================================
  // FETCH NIMIQ NETWORK STATUS
  // =====================================================

  const refreshNetwork = useCallback(async (provider) => {
    if (!provider) return;

    try {
      const isCons = await getConsensusStatus(provider);
      setConsensus(Boolean(isCons));

      const height = await getBlockHeight(provider);
      if (height !== null) {
        setBlockNumber(height);
      }
    } catch (err) {
      console.warn("Error refreshing network status:", err);
    }
  }, []);

  // =====================================================
  // CONNECT TO NIMIQ PAY
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
        throw new Error("Nimiq wallet provider could not be initialized.");
      }

      setNimiq(provider);

      const address = await getNimiqAccount(provider);
      if (!address) {
        throw new Error("No Nimiq wallet account is connected.");
      }

      setWalletAddress(address);
      setIsConnected(true);
      localStorage.setItem("nimiq_wallet", address);

      const { user: authUser, profile: authProfile } =
        await loginWithWallet(address);
      setUser(authUser);
      setProfile(authProfile);

      await refreshBalance(address);
      await refreshNetwork(provider);

      navigate("/dashboard", { replace: true });

      return address;
    } catch (err) {
      console.error("Nimiq wallet connection error:", err);

      const message = err?.message?.toLowerCase() || "";
      let friendlyMessage = err?.message || "Failed to connect Nimiq wallet.";

      if (
        message.includes("reject") ||
        message.includes("cancel") ||
        message.includes("denied")
      ) {
        friendlyMessage = "Wallet connection was cancelled.";
      }

      setError(friendlyMessage);
      setWalletAddress(null);
      setIsConnected(false);
      setBalance(0);
      setBalanceWarning(null);
      localStorage.removeItem("nimiq_wallet");

      throw new Error(friendlyMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, [loading, nimiq, navigate, refreshBalance, refreshNetwork]);

  // =====================================================
  // RESTORE SESSION
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        setIsInitializing(true);

        const { session, user: existingUser, profile: existingProfile } =
          await getCurrentSession();

        if (!mounted) return;

        if (session && existingUser) {
          setUser(existingUser);
          setProfile(existingProfile);
        }

        let provider = null;
        try {
          provider = await initNimiq({ timeout: 4000 });
        } catch (providerError) {
          console.log("Nimiq Pay is not available:", providerError?.message);
        }

        if (!mounted) return;

        if (provider) {
          setNimiq(provider);
          await refreshNetwork(provider);
        }
      } catch (err) {
        console.warn("Session restore error:", err);
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
  }, [refreshNetwork]);

  const getWalletAddress = useCallback(() => walletAddress, [walletAddress]);

  // =====================================================
  // DISCONNECT WALLET
  // =====================================================

  const disconnectWallet = useCallback(async () => {
    setLoading(true);

    try {
      try {
        await logoutUser();
      } catch (err) {
        console.warn("Logout error:", err);
      }

      clearNimiqProvider();
      localStorage.removeItem("nimiq_wallet");

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

      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const value = {
    nimiq,
    walletAddress,
    isConnected,
    loading,
    isInitializing,
    error,
    user,
    profile,
    balance,
    balanceWarning,
    consensus,
    blockNumber,
    connectWallet,
    getWalletAddress,
    disconnectWallet,
    refreshBalance,
    refreshNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}