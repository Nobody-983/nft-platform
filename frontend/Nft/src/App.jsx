
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { WalletProvider } from "./context/walletContext";

import DashboardLayout from "./components/dashboardlayout";

import NFTDetails from "./pages/nftDetails";

import Dashboard from "./pages/dashboard";
import Marketplace from "./pages/market";
import Wallet from "./pages/wallet";
import Account from "./pages/Account";
import Auth from "./pages/auth";
import CreateNFT from "./pages/createNft";

function AppContent() {
  return (
    <Routes>
      {/* ================= AUTH ================= */}

      <Route path="/" element={<Auth />} />

      <Route path="/login" element={<Auth />} />

      {/* ================= APP ================= */}

      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/wallet"
          element={<Wallet />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/create-nft"
          element={<CreateNFT />}
        />

        <Route
          path="/nft/:id"
          element={<NFTDetails />}
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
