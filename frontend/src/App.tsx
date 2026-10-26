import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/layout/Header/Header";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { HomePage } from "./pages/home/HomePage";
import {
    AdminPage,
    ConfirmSubmissionPage,
    LoginPage,
    NotFoundPage,
    PastRoundsPage,
    SettingsPage,
} from "./pages/lazyPages";

function RouteFallback() {
    return <div className="loading">Loading...</div>;
}

function AppLayout() {
    return (
        <div className="app-layout">
            <Header />
            <main className="main-content">
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/past-rounds" element={<PastRoundsPage />} />
                        <Route path="/processSubmission" element={<ConfirmSubmissionPage />} />
                        <Route
                            element={
                                <AuthProvider>
                                    <Outlet />
                                </AuthProvider>
                            }
                        >
                            <Route path="/login" element={<LoginPage />} />
                            <Route element={<ProtectedRoute />}>
                                <Route path="/admin" element={<AdminPage />} />
                                <Route path="/admin/settings/:section?" element={<SettingsPage />} />
                            </Route>
                        </Route>
                        <Route path="/secure" element={<Navigate to="/admin" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}
