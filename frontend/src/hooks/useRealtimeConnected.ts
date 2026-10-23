import { useSyncExternalStore } from "react";
import { isRealtimeConnected, onStatus } from "../api/realtime/socket";

export function useRealtimeConnected(): boolean {
    return useSyncExternalStore(onStatus, isRealtimeConnected);
}
