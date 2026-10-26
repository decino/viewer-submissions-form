const API_PREFIX = "/rest";

export class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, message: string, body: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

async function failIfNotOk(response: Response): Promise<void> {
    if (response.ok) {
        return;
    }

    const body = await response.json().catch(() => null);
    const message = (body as { message?: string } | null)?.message ?? `API error: ${response.status}`;
    throw new ApiError(response.status, message, body);
}

async function handleResponse<T>(response: Response): Promise<T> {
    await failIfNotOk(response);

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
    }
    return (await response.json()) as T;
}

export async function apiFetch<T>(path: string): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        credentials: "include",
    });
    return handleResponse<T>(response);
}

export async function apiFetchText(path: string): Promise<string> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        credentials: "include",
    });
    await failIfNotOk(response);
    return response.text();
}

export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        method: "POST",
        headers: body === undefined ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "include",
    });
    return handleResponse<T>(response);
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        method: "POST",
        body: formData,
        credentials: "include",
    });
    return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse<T>(response);
}

export async function apiDeleteWithBody<T, B = unknown>(path: string, body: B): Promise<T> {
    const response = await fetch(`${API_PREFIX}${path}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });
    return handleResponse<T>(response);
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") {
            continue;
        }

        search.set(key, String(value));
    }

    const qs = search.toString();
    return qs ? `?${qs}` : "";
}
