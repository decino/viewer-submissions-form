import { io, type Socket } from "socket.io-client";

type FrameHandler = (name: string, data: unknown) => void;

type StatusHandler = () => void;

interface SocketState {
    refCount: number;
    socket: Socket | null;
}

const NAMESPACE = "/submission";

const state: SocketState = {
    refCount: 0,
    socket: null,
};

const frameHandlers = new Set<FrameHandler>();
const statusHandlers = new Set<StatusHandler>();

function notifyStatus(): void {
    for (const handler of statusHandlers) {
        handler();
    }
}

function receiveFrame(name: string, data: unknown): void {
    for (const handler of frameHandlers) {
        handler(name, data);
    }
}

export function openRealtimeSocket(): void {
    state.refCount += 1;

    if (state.socket !== null) {
        return;
    }

    const socket = io(NAMESPACE);
    socket.on("connect", notifyStatus);
    socket.on("disconnect", notifyStatus);
    socket.onAny(receiveFrame);
    state.socket = socket;
}

export function closeRealtimeSocket(): void {
    state.refCount = Math.max(0, state.refCount - 1);

    if (state.refCount > 0 || state.socket === null) {
        return;
    }

    const socket = state.socket;
    state.socket = null;
    socket.disconnect();
}

export function isRealtimeConnected(): boolean {
    return state.socket?.connected ?? false;
}

export function onFrame(handler: FrameHandler): () => void {
    frameHandlers.add(handler);

    return () => {
        frameHandlers.delete(handler);
    };
}

export function onStatus(handler: StatusHandler): () => void {
    statusHandlers.add(handler);

    return () => {
        statusHandlers.delete(handler);
    };
}
