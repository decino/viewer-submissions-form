import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthContextValue } from "../context/authContextValue";
import { WadFileProvider } from "../context/WadFileContext";
import type { SessionUser } from "../types/api";
import { makeAuthContext } from "./fixtures";

interface ProviderOptions {
    user?: SessionUser | null;
    auth?: Partial<AuthContextValue>;
    queryClient?: QueryClient;
    route?: string;
}

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
            mutations: { retry: false },
        },
    });
}

function wrap(children: ReactNode, options: ProviderOptions, queryClient: QueryClient): ReactElement {
    const auth = makeAuthContext({ user: options.user ?? null, ...options.auth });

    return (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[options.route ?? "/"]}>
                <AuthContext.Provider value={auth}>
                    <WadFileProvider>{children}</WadFileProvider>
                </AuthContext.Provider>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}): RenderResult {
    const queryClient = options.queryClient ?? createTestQueryClient();
    const result = render(wrap(ui, options, queryClient));

    return {
        ...result,
        rerender: (next: ReactNode) => result.rerender(wrap(next, options, queryClient)),
    };
}

export function providerWrapper(
    options: ProviderOptions = {},
): ({ children }: { children: ReactNode }) => ReactElement {
    const queryClient = options.queryClient ?? createTestQueryClient();
    return ({ children }: { children: ReactNode }) => wrap(children, options, queryClient);
}
