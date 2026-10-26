type StorageArea = "local" | "session";

function storageFor(area: StorageArea): Storage {
    return area === "local" ? localStorage : sessionStorage;
}

export function readStored<T>(area: StorageArea, key: string): T | null {
    try {
        const raw = storageFor(area).getItem(key);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function writeStored(area: StorageArea, key: string, value: unknown) {
    try {
        storageFor(area).setItem(key, JSON.stringify(value));
    } catch {
        return;
    }
}

export function removeStored(area: StorageArea, key: string) {
    try {
        storageFor(area).removeItem(key);
    } catch {
        return;
    }
}
