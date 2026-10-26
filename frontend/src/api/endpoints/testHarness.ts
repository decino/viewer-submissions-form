import { expect, it, type Mock, vi } from "vitest";
import { apiDelete, apiDeleteWithBody, apiFetch, apiFetchText, apiPost, apiPostFormData } from "../client";

export interface RequestCase {
    name: string;
    call: () => Promise<unknown>;
    transport: Mock;
    request: unknown[];
    strict?: boolean;
}

export const fetchMock = vi.mocked(apiFetch);
export const fetchTextMock = vi.mocked(apiFetchText);
export const postMock = vi.mocked(apiPost);
export const postFormDataMock = vi.mocked(apiPostFormData);
export const deleteMock = vi.mocked(apiDelete);
export const deleteWithBodyMock = vi.mocked(apiDeleteWithBody);

export function resetTransports(): void {
    fetchMock.mockResolvedValue({});
    fetchTextMock.mockResolvedValue("");
    postMock.mockResolvedValue({});
    postFormDataMock.mockResolvedValue({});
    deleteMock.mockResolvedValue({});
    deleteWithBodyMock.mockResolvedValue({});
}

export function runRequestCases(cases: RequestCase[]): void {
    it.each(cases)("$name", async ({ call, transport, request, strict }) => {
        // given the call and the request it should produce, from the table row

        // when
        await call();

        // then
        if (strict) {
            expect(transport.mock.lastCall).toStrictEqual(request);
            return;
        }

        expect(transport).toHaveBeenCalledWith(...request);
    });
}
