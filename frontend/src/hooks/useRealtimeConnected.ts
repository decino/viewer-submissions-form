import { useSyncExternalStore } from "react";
import { submissionSocket } from "../api/realtime/socket";

function onConnectionChange(listener: () => void): () => void {
    submissionSocket.on("connect", listener);
    submissionSocket.on("disconnect", listener);

    return () => {
        submissionSocket.off("connect", listener);
        submissionSocket.off("disconnect", listener);
    };
}

export function useRealtimeConnected(): boolean {
    return useSyncExternalStore(onConnectionChange, () => submissionSocket.connected);
}
