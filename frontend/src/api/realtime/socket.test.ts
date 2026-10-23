import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as SocketModule from "./socket";

type Listener = (...args: unknown[]) => void;

interface FakeSocket {
    connected: boolean;
    listeners: Map<string, Listener>;
    anyListener: Listener | null;
    on: (event: string, listener: Listener) => void;
    onAny: (listener: Listener) => void;
    disconnect: () => void;
}

const created = vi.hoisted(() => ({ sockets: [] as FakeSocket[], namespaces: [] as string[] }));

vi.mock("socket.io-client", () => ({
    io: (namespace: string) => {
        const socket: FakeSocket = {
            connected: false,
            listeners: new Map(),
            anyListener: null,
            on(event, listener) {
                socket.listeners.set(event, listener);
            },
            onAny(listener) {
                socket.anyListener = listener;
            },
            disconnect: vi.fn(() => {
                socket.connected = false;
                socket.listeners.get("disconnect")?.();
            }),
        };
        created.sockets.push(socket);
        created.namespaces.push(namespace);
        return socket;
    },
}));

let socketModule: typeof SocketModule;

function connect(socket: FakeSocket): void {
    socket.connected = true;
    socket.listeners.get("connect")?.();
}

beforeEach(async () => {
    created.sockets = [];
    created.namespaces = [];
    vi.resetModules();
    socketModule = await import("./socket");
});

describe("openRealtimeSocket", () => {
    it("connects once to the submission namespace however many callers open it", () => {
        // when
        socketModule.openRealtimeSocket();
        socketModule.openRealtimeSocket();

        // then
        expect(created.namespaces).toEqual(["/submission"]);
    });

    it("hands every named server event to the frame handlers", () => {
        // given
        const handler = vi.fn();
        socketModule.onFrame(handler);
        socketModule.openRealtimeSocket();

        // when
        created.sockets[0].anyListener?.("deleteSubmission", [4, 5]);

        // then
        expect(handler).toHaveBeenCalledWith("deleteSubmission", [4, 5]);
    });
});

describe("connection status", () => {
    it("reports the connection and tells status handlers when it changes", () => {
        // given
        const handler = vi.fn();
        socketModule.onStatus(handler);
        socketModule.openRealtimeSocket();

        // when
        connect(created.sockets[0]);

        // then
        expect(handler).toHaveBeenCalledTimes(1);
        expect(socketModule.isRealtimeConnected()).toBe(true);
    });

    it("reports no connection before the socket has been opened", () => {
        // then
        expect(socketModule.isRealtimeConnected()).toBe(false);
    });
});

describe("closeRealtimeSocket", () => {
    it("keeps the connection while another caller still has it open", () => {
        // given
        socketModule.openRealtimeSocket();
        socketModule.openRealtimeSocket();

        // when
        socketModule.closeRealtimeSocket();

        // then
        expect(created.sockets[0].disconnect).not.toHaveBeenCalled();
    });

    it("disconnects when the last caller closes it", () => {
        // given
        socketModule.openRealtimeSocket();
        connect(created.sockets[0]);

        // when
        socketModule.closeRealtimeSocket();

        // then
        expect(created.sockets[0].disconnect).toHaveBeenCalledOnce();
        expect(socketModule.isRealtimeConnected()).toBe(false);
    });

    it("reconnects with a fresh socket when opened again after closing", () => {
        // given
        socketModule.openRealtimeSocket();
        socketModule.closeRealtimeSocket();

        // when
        socketModule.openRealtimeSocket();

        // then
        expect(created.sockets).toHaveLength(2);
    });
});
