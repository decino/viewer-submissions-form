import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveWadValidation } from "../../api/endpoints/utils";
import { expectInvalidated } from "../../test-utils/query";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { WadValidation } from "../../types/api";
import { useSaveWadValidation } from "./settings";

vi.mock("../../api/endpoints/utils", () => ({
    saveWadValidation: vi.fn(),
}));

const mockedSaveWadValidation = vi.mocked(saveWadValidation);

const validation: WadValidation = {
    allowedExtensions: ["wad", "zip"],
    allowedHeaders: ["PWAD", "PK%03%04"],
    allowedExtensionsZip: ["wad"],
    allowedHeadersZip: [null],
};

function setup() {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(useSaveWadValidation, { wrapper: providerWrapper({ queryClient }) });

    return { result, queryClient, invalidate };
}

beforeEach(() => {
    mockedSaveWadValidation.mockResolvedValue(undefined);
});

describe("useSaveWadValidation", () => {
    it("saves the rules and refreshes them along with the upload config the submit form reads", async () => {
        // given
        const { result, queryClient } = setup();

        // when
        await act(async () => {
            await result.current.mutateAsync(validation);
        });

        // then
        expect(mockedSaveWadValidation.mock.lastCall?.[0]).toEqual(validation);
        expectInvalidated(queryClient, ["admin", "wad-validation"]);
        expectInvalidated(queryClient, ["config", "upload"]);
    });

    it("leaves the cache alone when the rules are refused", async () => {
        // given
        mockedSaveWadValidation.mockRejectedValue(new Error("Every row needs an extension"));
        const { result, invalidate } = setup();

        // when
        await act(async () => {
            await expect(result.current.mutateAsync(validation)).rejects.toThrow("Every row needs an extension");
        });

        // then
        expect(invalidate).not.toHaveBeenCalled();
    });
});
