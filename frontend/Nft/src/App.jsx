import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/dashboardlayout";

import Dashboard from "./pages/dashboard";
import Marketplace from "./pages/market";
import Wallet from "./pages/wallet";
import Account from "./pages/Account";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<DashboardLayout />}>

          <Route path="/" element={<Dashboard />} />

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

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;