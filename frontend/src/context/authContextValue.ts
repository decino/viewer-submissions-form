import { createContext } from "react";
import type { SessionUser } from "../types/api";

export interface AuthContextValue {
    user: SessionUser | null;
    loading: boolean;
    error: string | null;
    loginUser: (email: string, password: string, turnstileToken?: string) => Promise<void>;
    logoutUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
