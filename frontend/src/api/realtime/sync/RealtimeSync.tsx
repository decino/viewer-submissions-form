import { useEffect } from "react";
import { closeRealtimeSocket, openRealtimeSocket } from "../socket";
import { useCurrentRoundSync } from "./useCurrentRoundSync";

export function RealtimeSync(): null {
    useCurrentRoundSync();

    useEffect(() => {
        openRealtimeSocket();

        return closeRealtimeSocket;
    }, []);

    return null;
}
