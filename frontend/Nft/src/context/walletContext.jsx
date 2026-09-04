import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  initNimiq,
  fetchNimiqBalance,
  getConsensusStatus,
  getBlockHeight,
} from "../lib/nimiq";

import {
  loginWithWallet,
  logoutUser,
  getCurrentSession,
} from "../services/auth";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [nimiq, setNimiq] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [consensus, setConsensus] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);
  const [error, setError] = useState(null);

  // ================= FETCH BALANCE & NETWORK =================

  const refreshBalance = useCallback(async (targetAddress = walletAddress) => {
    if (!targetAddress) return;
    try {
      const bal = await fetchNimiqBalance(targetAddress);
      setBalance(bal);
    } catch (err) {
      console.warn("Error refreshing balance:", err);
    }
  }, [walletAddress]);

  const refreshNetwork = useCallback(async (provider = nimiq) => {
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
  }, [nimiq]);

  // ================= RESTORE EXISTING SESSION =================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const { session, user: existingUser, profile: existingProfile } =
          await getCurrentSession();

        if (!mounted) return;

        if (session && existingUser) {
          setUser(existingUser);
          setProfile(existingProfile);

          const addr = existingProfile?.wallet_address || null;
          if (addr) {
            setWalletAddress(addr);
            setIsConnected(true);
            refreshBalance(addr);
          }
        }

        // Silently try initializing Nimiq provider if inside Nimiq Pay
        try {
          const provider = await initNimiq({ timeout: 4000 });
          if (mounted && provider) {
            setNimiq(provider);
            refreshNetwork(provider);
          }
        } catch {
          // Normal when opened in regular desktop browser or outside Nimiq Pay
        }
      } catch (err) {
        console.warn("Session restore error:", err);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [refreshBalance, refreshNetwork]);

  // ================= CONNECT WALLET =================

  const connectWallet = async () => {
    if (loading) return null;

    setLoading(true);
    setError(null);

    try {
      // 1. Initialize Nimiq provider
      const provider = nimiq || (await initNimiq({ timeout: 10_000 }));
      if (!nimiq) {
        setNimiq(provider);
      }

      // 2. Request user accounts from Nimiq Pay
      const accounts = await provider.listAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No Nimiq wallet account was selected.");
      }

      const address = accounts[0];
      if (!address) {
        throw new Error("No Nimiq wallet account was selected.");
      }

      // 3. Authenticate with Supabase backend & provision user profile
      const { user: authUser, profile: authProfile } = await loginWithWallet(address);

      // 4. Update application state
      setWalletAddress(address);
      setIsConnected(true);
      setUser(authUser);
      setProfile(authProfile);

      // 5. Fetch balance and network state
      refreshBalance(address);
      refreshNetwork(provider);

      return address;
    } catch (err) {
      console.error("Nimiq wallet connection error:", err);
      const msg = err?.message?.toLowerCase() || "";
      let userFriendlyError = err?.message || "Failed to connect Nimiq wallet.";

      if (
        msg.includes("reject") ||
        msg.includes("cancel") ||
        msg.includes("denied")
      ) {
        userFriendlyError = "Wallet connection was cancelled.";
      }

      setError(userFriendlyError);
      throw new Error(userFriendlyError, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  // ================= GET CURRENT WALLET =================

  const getWalletAddress = () => {
    return walletAddress;
  };

  // ================= DISCONNECT =================

  const disconnectWallet = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout error:", err);
    }

    setWalletAddress(null);
    setIsConnected(false);
    setUser(null);
    setProfile(null);
    setBalance(0);
    setError(null);
  };

  // ================= CONTEXT VALUE =================

  const value = {
    nimiq,
    walletAddress,
    isConnected,
    loading,
    error,
    user,
    profile,
    balance,
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

// ================= HOOK =================

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}