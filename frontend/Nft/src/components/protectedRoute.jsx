import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "../context/walletContext";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user } = useWallet();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;