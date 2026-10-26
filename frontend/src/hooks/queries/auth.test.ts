import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/endpoints/auth";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { SessionUser } from "../../types/api";
import { useMe } from "./auth";

vi.mock("../../api/endpoints/auth", () => ({
    getCurrentUser: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const admin: SessionUser = { id: "1", email: "admin@example.test" };

beforeEach(() => {
    mockedGetCurrentUser.mockResolvedValue(admin);
});

describe("useMe", () => {
    it("keys the query as the session user", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["auth", "me"]);
    });

    it("hands back the signed in admin", async () => {
        // when
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.me).toEqual(admin);
    });

    it("reports why the session could not be checked, so it is not mistaken for being logged out", async () => {
        // given
        mockedGetCurrentUser.mockRejectedValue(new Error("Service unavailable"));

        // when
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.error).toBe("Service unavailable");
        expect(result.current.me).toBeNull();
    });

    it("reports nobody signed in when the server has no session", async () => {
        // given
        mockedGetCurrentUser.mockResolvedValue(null);

        // when
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.me).toBeNull();
    });

    it("asks the server again when refreshed, so a fresh login shows up", async () => {
        // given
        mockedGetCurrentUser.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // when
        await act(async () => {
            await result.current.refresh();
        });

        // then
        await waitFor(() => expect(result.current.me).toEqual(admin));
        expect(mockedGetCurrentUser).toHaveBeenCalledTimes(2);
    });

    it("reports loading and nobody signed in while the request is in flight", () => {
        // given
        mockedGetCurrentUser.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useMe(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toMatchObject({ me: null, loading: true });
    });
});
