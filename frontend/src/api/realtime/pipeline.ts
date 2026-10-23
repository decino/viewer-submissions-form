import { dispatch } from "./bus";
import { toRealtimeEvent } from "./guards";
import { isRealtimeConnected, onFrame, onStatus } from "./socket";

type EpochListener = () => void;

const epochListeners = new Set<EpochListener>();

let epoch = 0;
let installed = false;

function receiveFrame(name: string, data: unknown): void {
    const event = toRealtimeEvent(name, data);
    if (event === null) {
        return;
    }

    dispatch(event);
}

function bumpEpochOnConnect(): void {
    if (!isRealtimeConnected()) {
        return;
    }

    epoch += 1;

    for (const listener of Array.from(epochListeners)) {
        listener();
    }
}

export function ensureRealtimePipeline(): void {
    if (installed) {
        return;
    }

    installed = true;

    onFrame(receiveFrame);
    onStatus(bumpEpochOnConnect);
}

export function getRealtimeEpoch(): number {
    return epoch;
}

export function subscribeRealtimeEpoch(listener: EpochListener): () => void {
    ensureRealtimePipeline();

    epochListeners.add(listener);

    return () => {
        epochListeners.delete(listener);
    };
}
