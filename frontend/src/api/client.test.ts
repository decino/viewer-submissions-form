import { describe, expect, it, vi } from "vitest";
import {
    apiDelete,
    apiDeleteWithBody,
    ApiError,
    apiFetch,
    apiFetchText,
    apiPost,
    apiPostFormData,
    buildQueryString,
} from "./client";

function stubFetch(response: Response) {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

describe("apiFetch", () => {
    it("prefixes the REST mount and sends the session cookie", async () => {
        // given
        const fetchMock = stubFetch(jsonResponse({ id: 1 }));

        // when
        await apiFetch("/round/current");

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/round/current", { credentials: "include" });
    });

    it("returns the parsed body, including a JSON null", async () => {
        // given
        stubFetch(jsonResponse(null));

        // when
        const result = await apiFetch<null>("/round/current");

        // then
        expect(result).toBeNull();
    });

    it("returns undefined for a 204 without reading a body", async () => {
        // given
        stubFetch(new Response(null, { status: 204 }));

        // when
        const result = await apiFetch("/round/current");

        // then
        expect(result).toBeUndefined();
    });

    it("throws an ApiError carrying the server's message and status", async () => {
        // given
        stubFetch(jsonResponse({ name: "BAD_REQUEST", message: "Round is paused", status: 400 }, 400));

        // when
        const failure = await apiFetch("/round/current").catch((error: unknown) => error);

        // then
        expect(failure).toBeInstanceOf(ApiError);
        expect(failure).toMatchObject({ status: 400, message: "Round is paused" });
    });

    it("falls back to the status in the message when the error body is not JSON", async () => {
        // given
        stubFetch(new Response("gateway exploded", { status: 502 }));

        // when
        const failure = apiFetch("/round/current");

        // then
        await expect(failure).rejects.toMatchObject({ status: 502, message: "API error: 502" });
    });
});

describe("apiFetchText", () => {
    it("reads the body as text from the REST mount with the session cookie", async () => {
        // given
        const fetchMock = stubFetch(
            new Response("<html>idgames</html>", { status: 200, headers: { "Content-Type": "text/html" } }),
        );

        // when
        const result = await apiFetchText("/utils/corsProxy?url=x");

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/utils/corsProxy?url=x", { credentials: "include" });
        expect(result).toBe("<html>idgames</html>");
    });

    it("throws an ApiError instead of handing back the error page as text", async () => {
        // given
        stubFetch(jsonResponse({ message: "That page could not be fetched", status: 400 }, 400));

        // when
        const failure = apiFetchText("/utils/corsProxy?url=x");

        // then
        await expect(failure).rejects.toBeInstanceOf(ApiError);
        await expect(failure).rejects.toMatchObject({ status: 400, message: "That page could not be fetched" });
    });
});

describe("apiPost", () => {
    it("sends a JSON body with its content type and the session cookie", async () => {
        // given
        const fetchMock = stubFetch(jsonResponse({ success: true, description: "Entries verified" }));

        // when
        const result = await apiPost("/submission/verifyEntries", [1, 2]);

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/submission/verifyEntries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "[1,2]",
            credentials: "include",
        });
        expect(result).toEqual({ success: true, description: "Entries verified" });
    });

    it("sends neither a body nor a content type when there is nothing to send", async () => {
        // given
        const fetchMock = stubFetch(jsonResponse({ success: true, description: "Round paused" }));

        // when
        await apiPost("/submissionRound/pauseRound?pause=true");

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/submissionRound/pauseRound?pause=true", {
            method: "POST",
            headers: {},
            body: undefined,
            credentials: "include",
        });
    });

    it("returns undefined when the server answers with an empty body", async () => {
        // given
        stubFetch(new Response("", { status: 200, headers: { "content-length": "0" } }));

        // when
        const result = await apiPost("/utils/wadValidation", { allowedExtensions: ["wad"] });

        // then
        expect(result).toBeUndefined();
    });

    it("throws an ApiError carrying the server's message", async () => {
        // given
        stubFetch(jsonResponse({ name: "UNAUTHORIZED", message: "Incorrect email/password", status: 401 }, 401));

        // when
        const failure = apiPost("/auth/login", { email: "admin@example.test", password: "wrong" });

        // then
        await expect(failure).rejects.toMatchObject({ status: 401, message: "Incorrect email/password" });
    });
});

describe("apiPostFormData", () => {
    it("posts the form data untouched so the browser sets the multipart boundary", async () => {
        // given
        const formData = new FormData();
        formData.set("WADName", "Sunlust");
        const fetchMock = stubFetch(jsonResponse({ id: 7 }));

        // when
        await apiPostFormData("/submission/addEntry", formData);

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/submission/addEntry", {
            method: "POST",
            body: formData,
            credentials: "include",
        });
        expect(fetchMock.mock.calls[0][1]?.headers).toBeUndefined();
    });
});

describe("apiDelete", () => {
    it("sends a DELETE with the session cookie and no body", async () => {
        // given
        const fetchMock = stubFetch(jsonResponse({ success: true, description: "Round deleted" }));

        // when
        const result = await apiDelete("/submissionRound/9/deleteRound");

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/submissionRound/9/deleteRound", {
            method: "DELETE",
            credentials: "include",
        });
        expect(result).toEqual({ success: true, description: "Round deleted" });
    });
});

describe("apiDeleteWithBody", () => {
    it("sends a DELETE that carries a JSON body", async () => {
        // given
        const fetchMock = stubFetch(jsonResponse({ success: true, description: "Entries deleted" }));

        // when
        await apiDeleteWithBody("/submission/deleteEntries", [3, 5]);

        // then
        expect(fetchMock).toHaveBeenCalledWith("/rest/submission/deleteEntries", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: "[3,5]",
            credentials: "include",
        });
    });
});

describe("buildQueryString", () => {
    it("returns an empty string when there is nothing to send", () => {
        // when
        const qs = buildQueryString({ link: undefined, name: "" });

        // then
        expect(qs).toBe("");
    });

    it("skips undefined and empty values and keeps the rest in the order given", () => {
        // given
        const params = { name: "Round 5", endDate: undefined, link: "", pause: true };

        // when
        const qs = buildQueryString(params);

        // then
        expect(qs).toBe("?name=Round+5&pause=true");
    });

    it("keeps false and zero, because the server reads them as real values", () => {
        // given
        const params = { includeActive: false, count: 0 };

        // when
        const qs = buildQueryString(params);

        // then
        expect(qs).toBe("?includeActive=false&count=0");
    });

    it("percent-encodes a URL passed as a value", () => {
        // given
        const params = { url: "https://www.doomworld.com/idgames/?id=1&x=2" };

        // when
        const qs = buildQueryString(params);

        // then
        expect(qs).toBe("?url=https%3A%2F%2Fwww.doomworld.com%2Fidgames%2F%3Fid%3D1%26x%3D2");
    });
});
