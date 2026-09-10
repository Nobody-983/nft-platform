
import { Navigate, useLocation } from "react-router-dom";

import { useWallet } from "../context/walletContext";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const {
    user,
    isInitializing,
  } = useWallet();

  // Wait until the wallet/Supabase session
  // has finished restoring.
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-lg font-medium">
            Loading...
          </div>

          <div className="text-sm opacity-60">
            Restoring your wallet session
          </div>
        </div>
      </div>
    );
  }

  // Session restoration is finished and
  // there is no authenticated marketplace user.
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Authenticated user can access the protected page.
  return children;
}

export default ProtectedRoute;
