import type { AuthContextValue } from "../../context/authContextValue";

export function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
    return {
        user: null,
        loading: false,
        error: null,
        loginUser: () => Promise.resolve(),
        logoutUser: () => {},
        ...overrides,
    };
}
