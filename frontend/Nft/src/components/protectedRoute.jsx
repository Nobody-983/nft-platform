import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "../context/walletContext";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, isInitializing } = useWallet();

  // During initial session restoration, don't redirect
  if (isInitializing) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;