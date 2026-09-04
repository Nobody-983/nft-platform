import {
  createContext,
  useContext,
  useState,
} from "react";

import { init } from "@nimiq/mini-app-sdk";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [nimiq, setNimiq] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= CONNECT WALLET =================

  const connectWallet = async () => {
    if (loading) return null;

    setLoading(true);

    try {
      // Initialize Nimiq provider
      const provider = nimiq || (await init());

      // Save provider in memory
      if (!nimiq) {
        setNimiq(provider);
      }

      // Get wallet accounts
      const accounts = await provider.listAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "No Nimiq wallet account was selected."
        );
      }

      const address = accounts[0];

      if (!address) {
        throw new Error(
          "No Nimiq wallet account was selected."
        );
      }

      // Update application state
      setWalletAddress(address);
      setIsConnected(true);

      return address;
    } catch (error) {
      console.error(
        "Nimiq wallet connection error:",
        error
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ================= GET CURRENT WALLET =================

  const getWalletAddress = () => {
    return walletAddress;
  };

  // ================= DISCONNECT =================

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
  };

  // ================= CONTEXT VALUE =================

  const value = {
    nimiq,

    walletAddress,

    isConnected,

    loading,

    connectWallet,

    getWalletAddress,

    disconnectWallet,
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
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}