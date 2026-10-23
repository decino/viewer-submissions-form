import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as PipelineModule from "./pipeline";

const socket = vi.hoisted(() => ({
    frameHandlers: [] as ((name: string, data: unknown) => void)[],
    statusHandlers: [] as (() => void)[],
    connected: false,
}));

const bus = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock("./socket", () => ({
    onFrame: (handler: (name: string, data: unknown) => void) => {
        socket.frameHandlers.push(handler);
        return () => {};
    },
    onStatus: (handler: () => void) => {
        socket.statusHandlers.push(handler);
        return () => {};
    },
    isRealtimeConnected: () => socket.connected,
}));

vi.mock("./bus", () => ({ dispatch: bus.dispatch }));

let pipeline: typeof PipelineModule;

function receive(name: string, data: unknown): void {
    for (const handler of socket.frameHandlers) {
        handler(name, data);
    }
}

function changeStatus(connected: boolean): void {
    socket.connected = connected;
    for (const handler of socket.statusHandlers) {
        handler();
    }
}

beforeEach(async () => {
    socket.frameHandlers = [];
    socket.statusHandlers = [];
    socket.connected = false;
    bus.dispatch.mockReset();
    vi.resetModules();
    pipeline = await import("./pipeline");
});

describe("realtime pipeline", () => {
    it("installs its socket listeners only once", () => {
        // when
        pipeline.ensureRealtimePipeline();
        pipeline.ensureRealtimePipeline();

        // then
        expect(socket.frameHandlers).toHaveLength(1);
        expect(socket.statusHandlers).toHaveLength(1);
    });

    it("dispatches a well-formed server event onto the bus", () => {
        // given
        pipeline.ensureRealtimePipeline();

        // when
        receive("newSubmission", { id: 3, wadName: "Sunlust", wadLevel: "MAP12" });

        // then
        expect(bus.dispatch).toHaveBeenCalledWith({
            type: "newSubmission",
            data: { id: 3, wadName: "Sunlust", wadLevel: "MAP12" },
        });
    });

    it("drops unknown events and malformed payloads", () => {
        // given
        pipeline.ensureRealtimePipeline();

        // when
        receive("roundPaused", {});
        receive("deleteSubmission", "3");

        // then
        expect(bus.dispatch).not.toHaveBeenCalled();
    });

    it("counts each connection, but not disconnections, in the epoch", () => {
        // given
        const listener = vi.fn();
        pipeline.subscribeRealtimeEpoch(listener);

        // when
        changeStatus(true);
        changeStatus(false);
        changeStatus(true);

        // then
        expect(pipeline.getRealtimeEpoch()).toBe(2);
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
