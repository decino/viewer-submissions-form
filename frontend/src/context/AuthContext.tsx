import { type PropsWithChildren, useCallback, useMemo } from "react";
import { AuthContext } from "./authContextValue";
import { useMe } from "../hooks/queries/auth";
import { useLogin, useLogout } from "../hooks/mutations/auth";

export function AuthProvider({ children }: PropsWithChildren) {
    const { me, loading, error, refresh } = useMe();
    const { mutateAsync: login } = useLogin();
    const logoutUser = useLogout();

    const loginUser = useCallback(
        async (email: string, password: string, turnstileToken?: string) => {
            await login({ email, password, turnstileToken });
            await refresh();
        },
        [login, refresh],
    );

    const value = useMemo(
        () => ({ user: me, loading, error, loginUser, logoutUser }),
        [me, loading, error, loginUser, logoutUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
