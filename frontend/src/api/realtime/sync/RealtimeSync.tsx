import { useEffect } from "react";
import { submissionSocket } from "../socket";
import { useCurrentRoundSync } from "./useCurrentRoundSync";

export function RealtimeSync(): null {
    useCurrentRoundSync();

    useEffect(() => {
        submissionSocket.connect();

        return () => {
            submissionSocket.disconnect();
        };
    }, []);

    return null;
}
