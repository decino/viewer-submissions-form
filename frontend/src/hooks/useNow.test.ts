import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNow } from "./useNow";

describe("useNow", () => {
    it("moves on with the clock once per interval", () => {
        // given
        vi.useFakeTimers({ now: 1_000_000 });
        const { result } = renderHook(() => useNow(1000));
        const start = result.current;

        // when
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // then
        expect(start).toBe(1_000_000);
        expect(result.current).toBe(1_003_000);
    });

    it("stops ticking once unmounted", () => {
        // given
        vi.useFakeTimers({ now: 1_000_000 });
        const { unmount } = renderHook(() => useNow(1000));

        // when
        unmount();

        // then
        expect(vi.getTimerCount()).toBe(0);
    });
});
