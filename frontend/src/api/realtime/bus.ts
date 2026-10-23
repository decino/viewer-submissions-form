import type { RealtimeEvent, RealtimeEventName, RealtimeEventOf } from "./events";

export type RealtimeEventHandler<K extends RealtimeEventName = RealtimeEventName> = (event: RealtimeEventOf<K>) => void;

export type RealtimeUnsubscribe = () => void;

type StoredHandler = (event: RealtimeEvent) => void;

const handlersByName = new Map<RealtimeEventName, Set<StoredHandler>>();

function rethrowAsync(error: unknown): void {
    queueMicrotask(() => {
        throw error;
    });
}

export function subscribe<K extends RealtimeEventName>(name: K, handler: RealtimeEventHandler<K>): RealtimeUnsubscribe {
    const stored = handler as StoredHandler;

    const existing = handlersByName.get(name);
    if (existing) {
        existing.add(stored);
    } else {
        handlersByName.set(name, new Set([stored]));
    }

    let released = false;

    return () => {
        if (released) {
            return;
        }
        released = true;

        const set = handlersByName.get(name);
        if (!set) {
            return;
        }
        set.delete(stored);
        if (set.size === 0) {
            handlersByName.delete(name);
        }
    };
}

export function dispatch(event: RealtimeEvent): void {
    const subscribed = handlersByName.get(event.type);
    if (!subscribed || subscribed.size === 0) {
        return;
    }

    const snapshot = Array.from(subscribed);

    for (const handler of snapshot) {
        try {
            handler(event);
        } catch (error) {
            rethrowAsync(error);
        }
    }
}
