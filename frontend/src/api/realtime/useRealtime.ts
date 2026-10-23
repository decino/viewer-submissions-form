import { useEffect, useRef, useSyncExternalStore } from "react";
import { type RealtimeEventHandler, subscribe } from "./bus";
import type { RealtimeEventName, RealtimeEventOf } from "./events";
import { ensureRealtimePipeline, getRealtimeEpoch, subscribeRealtimeEpoch } from "./pipeline";

export function useRealtimeEvent<K extends RealtimeEventName>(name: K, handler: RealtimeEventHandler<K>): void {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        ensureRealtimePipeline();

        return subscribe(name, (event: RealtimeEventOf<K>) => {
            handlerRef.current(event);
        });
    }, [name]);
}

export function useRealtimeStatus(): number {
    return useSyncExternalStore(subscribeRealtimeEpoch, getRealtimeEpoch);
}
