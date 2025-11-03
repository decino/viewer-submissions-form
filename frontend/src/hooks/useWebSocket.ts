import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { SubmissionModel } from "../types";

type SubmissionCallback = (data: SubmissionModel) => void;
type DeleteCallback = (ids: number[]) => void;

export function useWebSocket(url?: string) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketUrl = url || window.location.origin;
        const newSocket = io(socketUrl, {
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            setIsConnected(true);
        });

        newSocket.on("disconnect", () => {
            setIsConnected(false);
        });

        socketRef.current = newSocket;

        return () => {
            newSocket.disconnect();
        };
    }, [url]);

    const onSubmission = useCallback((callback: SubmissionCallback) => {
        if (!socketRef.current) {
            return;
        }

        socketRef.current.on("entry", callback);

        return () => {
            socketRef.current?.off("entry", callback);
        };
    }, []);

    const onDelete = useCallback((callback: DeleteCallback) => {
        if (!socketRef.current) {
            return;
        }

        socketRef.current.on("delete", callback);

        return () => {
            socketRef.current?.off("delete", callback);
        };
    }, []);

    return {
        isConnected,
        onSubmission,
        onDelete,
    };
}
