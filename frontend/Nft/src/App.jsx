import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import { supabase } from "./lib/supabase";

import DashboardLayout from "./components/dashboardlayout";

import Dashboard from "./pages/dashboard";
import Marketplace from "./pages/market";
import Wallet from "./pages/wallet";
import Account from "./pages/Account";
import Auth from "./pages/auth";
import CreateNFT from "./pages/createNft";

function AppContent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current logged-in user when the app starts
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      }

      const currentUser = data?.session?.user || null;

      setUser(currentUser);
      setLoading(false);
    };

    getSession();

    // Listen for authentication changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;

      setUser(currentUser);

      // Redirect when the user signs in
      if (event === "SIGNED_IN" && currentUser) {
        navigate("/dashboard");
      }

      // Redirect when the user signs out
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080f] text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* ================= AUTH ================= */}

      <Route path="/" element={<Auth />} />

      <Route path="/login" element={<Auth />} />

      {/* ================= APP ================= */}

      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={<Dashboard user={user} />}
        />

        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/wallet"
          element={<Wallet user={user} />}
        />

        <Route
          path="/account"
          element={<Account user={user} />}
        />

        <Route
          path="/create-nft"
          element={<CreateNFT user={user} />}
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;