import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ ownerOnly = false }) {
  const { user, isOwner, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loader">Preparing your experience…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (ownerOnly && !isOwner) return <Navigate to="/" replace />;
  return <Outlet />;
}
