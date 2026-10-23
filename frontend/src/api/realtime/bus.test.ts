import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as BusModule from "./bus";
import type { RealtimeEvent, RealtimeEventName } from "./events";

let bus: typeof BusModule;
let windowErrors: unknown[] = [];

const nativeQueueMicrotask = queueMicrotask;

const submissionEventNames: Record<"added" | "removed", RealtimeEventName> = {
    added: "newSubmission",
    removed: "deleteSubmission",
};

function captureWindowError(event: ErrorEvent): void {
    event.preventDefault();
    windowErrors.push(event.error);
}

function emulateBrowserErrorReporting(): void {
    vi.stubGlobal("queueMicrotask", (callback: VoidFunction) => {
        nativeQueueMicrotask(() => {
            try {
                callback();
            } catch (error) {
                window.dispatchEvent(new ErrorEvent("error", { error, message: String(error), cancelable: true }));
            }
        });
    });
}

function newSubmissionEvent(id: number): RealtimeEvent {
    return { type: "newSubmission", data: { id, wadName: "Sunlust", wadLevel: "MAP12" } };
}

function deleteSubmissionEvent(ids: number[]): RealtimeEvent {
    return { type: "deleteSubmission", data: ids };
}

beforeEach(async () => {
    windowErrors = [];
    window.addEventListener("error", captureWindowError);
    emulateBrowserErrorReporting();
    vi.resetModules();
    bus = await import("./bus");
});

afterEach(() => {
    window.removeEventListener("error", captureWindowError);
});

describe("realtime bus delivery", () => {
    it("hands an event to a handler subscribed to its name", () => {
        // given
        const handler = vi.fn();
        bus.subscribe("newSubmission", handler);
        const event = newSubmissionEvent(1);

        // when
        bus.dispatch(event);

        // then
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(event);
    });

    it("leaves a handler subscribed to a different name alone", () => {
        // given
        const handler = vi.fn();
        bus.subscribe("deleteSubmission", handler);

        // when
        bus.dispatch(newSubmissionEvent(1));

        // then
        expect(handler).not.toHaveBeenCalled();
    });

    it("subscribes to a name that is only known at runtime", () => {
        // given
        const handler = vi.fn();
        const wanted = submissionEventNames.added;
        bus.subscribe(wanted, handler);
        const event = newSubmissionEvent(1);

        // when
        bus.dispatch(event);

        // then
        expect(handler).toHaveBeenCalledWith(event);
    });

    it("ignores an event nobody is subscribed to", () => {
        // given
        const handler = vi.fn();
        bus.subscribe("newSubmission", handler);

        // when
        bus.dispatch(deleteSubmissionEvent([1]));

        // then
        expect(handler).not.toHaveBeenCalled();
        expect(windowErrors).toEqual([]);
    });
});

describe("realtime bus handler isolation", () => {
    it("does not stop the handlers registered after a throwing one", async () => {
        // given
        const failure = new Error("handler is broken");
        const throwing = vi.fn(() => {
            throw failure;
        });
        const second = vi.fn();
        const third = vi.fn();
        bus.subscribe("newSubmission", throwing);
        bus.subscribe("newSubmission", second);
        bus.subscribe("newSubmission", third);
        const event = newSubmissionEvent(1);

        // when
        bus.dispatch(event);
        await Promise.resolve();

        // then
        expect(throwing).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledWith(event);
        expect(third).toHaveBeenCalledWith(event);
        expect(windowErrors).toEqual([failure]);
    });

    it("rethrows a handler failure where a window error listener sees it", async () => {
        // given
        const failure = new Error("handler is broken");
        bus.subscribe("newSubmission", () => {
            throw failure;
        });

        // when
        bus.dispatch(newSubmissionEvent(1));

        // then
        expect(windowErrors).toEqual([]);
        await Promise.resolve();
        expect(windowErrors).toEqual([failure]);
    });

    it("keeps a handler that threw subscribed for the next event", async () => {
        // given
        const failure = new Error("handler is broken");
        const throwing = vi.fn(() => {
            throw failure;
        });
        bus.subscribe("newSubmission", throwing);

        // when
        bus.dispatch(newSubmissionEvent(1));
        bus.dispatch(newSubmissionEvent(2));
        await Promise.resolve();

        // then
        expect(throwing).toHaveBeenCalledTimes(2);
        expect(windowErrors).toEqual([failure, failure]);
    });
});

describe("realtime bus subscription lifetime", () => {
    it("stops delivering once the subscriber has unsubscribed", () => {
        // given
        const handler = vi.fn();
        const unsubscribe = bus.subscribe("newSubmission", handler);

        // when
        unsubscribe();
        bus.dispatch(newSubmissionEvent(1));

        // then
        expect(handler).not.toHaveBeenCalled();
    });

    it("ignores a second call to the same unsubscribe", () => {
        // given
        const handler = vi.fn();
        const stale = bus.subscribe("newSubmission", handler);
        stale();
        bus.subscribe("newSubmission", handler);

        // when
        stale();
        bus.dispatch(newSubmissionEvent(1));

        // then
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does not change who receives the current event when a handler unsubscribes during dispatch", () => {
        // given
        const second = vi.fn();
        const third = vi.fn();
        const unsubscribers: BusModule.RealtimeUnsubscribe[] = [];
        bus.subscribe("newSubmission", () => {
            for (const unsubscribe of unsubscribers) {
                unsubscribe();
            }
        });
        unsubscribers.push(bus.subscribe("newSubmission", second));
        unsubscribers.push(bus.subscribe("newSubmission", third));
        const event = newSubmissionEvent(1);

        // when
        bus.dispatch(event);

        // then
        expect(second).toHaveBeenCalledWith(event);
        expect(third).toHaveBeenCalledWith(event);

        bus.dispatch(newSubmissionEvent(2));
        expect(second).toHaveBeenCalledTimes(1);
        expect(third).toHaveBeenCalledTimes(1);
    });

    it("holds the current event back from a handler that subscribes during dispatch", () => {
        // given
        const latecomer = vi.fn();
        bus.subscribe("newSubmission", () => {
            bus.subscribe("newSubmission", latecomer);
        });

        // when
        bus.dispatch(newSubmissionEvent(1));

        // then
        expect(latecomer).not.toHaveBeenCalled();

        bus.dispatch(newSubmissionEvent(2));
        expect(latecomer).toHaveBeenCalledTimes(1);
    });
});
