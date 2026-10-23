import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ErrorBanner } from "../ErrorBanner/ErrorBanner";

export function ProtectedRoute() {
    const { user, loading, error } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
