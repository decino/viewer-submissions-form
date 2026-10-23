import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { WadValidation } from "../types/api";
import { useWadValidationForm } from "./useWadValidationForm";

const mocks = vi.hoisted(() => ({
    useWadValidation: vi.fn(),
    save: vi.fn(),
    saving: false,
}));

vi.mock("./queries/admin", () => ({ useWadValidation: mocks.useWadValidation }));

vi.mock("./mutations/settings", () => ({
    useSaveWadValidation: () => ({ mutateAsync: mocks.save, isPending: mocks.saving }),
}));

const ZIP_HEADER = "PK\u0003\u0004";

function makeValidation(overrides: Partial<WadValidation> = {}): WadValidation {
    return {
        allowedExtensions: ["WAD", "DEH"],
        allowedHeaders: ["PWAD", null],
        allowedExtensionsZip: ["ZIP"],
        allowedHeadersZip: ["PK%03%04"],
        ...overrides,
    };
}

function stubValidation(validation: WadValidation | null, loading = false, error: string | null = null): void {
    mocks.useWadValidation.mockReturnValue({ validation, loading, error });
}

function setup() {
    return renderHook(() => useWadValidationForm(), { wrapper: providerWrapper() });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.saving = false;
    mocks.save.mockResolvedValue(undefined);
    stubValidation(makeValidation());
});

describe("useWadValidationForm loading", () => {
    it("reports loading and offers no rows while the rules are on their way", () => {
        // given
        stubValidation(null, true);

        // when
        const { result } = setup();

        // then
        expect(result.current.loading).toBe(true);
        expect(result.current.loadError).toBeNull();
        expect(result.current.rows).toBeNull();
    });

    it("hands back why the rules could not be loaded and offers no rows to save", () => {
        // given
        stubValidation(null, false, "Could not load the WAD validation rules.");

        // when
        const { result } = setup();

        // then
        expect(result.current.loadError).toBe("Could not load the WAD validation rules.");
        expect(result.current.rows).toBeNull();
    });
});

describe("useWadValidationForm rows", () => {
    it("decodes the headers the server sends URI encoded", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.rows).toEqual({
            files: [
                { extension: "WAD", header: "PWAD", zip: false },
                { extension: "DEH", header: "", zip: false },
            ],
            zips: [{ extension: "ZIP", header: ZIP_HEADER, zip: true }],
        });
    });

    it("adds an empty row to the section it was asked for only", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.addRow("zips"));

        // then
        expect(result.current.rows?.zips).toHaveLength(2);
        expect(result.current.rows?.zips[1]).toEqual({ extension: "", header: "", zip: false });
        expect(result.current.rows?.files).toHaveLength(2);
    });

    it("removes the row at the given position", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.removeRow("files", 0));

        // then
        expect(result.current.rows?.files.map(row => row.extension)).toEqual(["DEH"]);
    });

    it("changes only the row being edited", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.updateRow("files", 1, { extension: "BEX" }));

        // then
        expect(result.current.rows?.files.map(row => row.extension)).toEqual(["WAD", "BEX"]);
    });

    it("fills in the zip header when a row is marked as a zip", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.toggleZip("files", 1, true));

        // then
        expect(result.current.rows?.files[1]).toEqual({ extension: "DEH", header: ZIP_HEADER, zip: true });
    });

    it("clears the header when a row stops being a zip", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.toggleZip("zips", 0, false));

        // then
        expect(result.current.rows?.zips[0]).toEqual({ extension: "ZIP", header: "", zip: false });
    });

    it("forgets the previous save result once a row changes", async () => {
        // given
        const { result } = setup();
        await act(() => result.current.save(submitEvent()));

        // when
        act(() => result.current.addRow("files"));

        // then
        expect(result.current.saved).toBe(false);
    });

    it("has unsaved changes from the first edit until they are saved", async () => {
        // given
        const { result } = setup();
        const untouched = result.current.dirty;

        // when
        act(() => result.current.updateRow("files", 1, { header: "#DEH" }));
        const edited = result.current.dirty;
        await act(() => result.current.save(submitEvent()));

        // then
        expect([untouched, edited, result.current.dirty]).toEqual([false, true, false]);
    });

    it("throws away every edit and message when it is reset", async () => {
        // given
        const { result } = setup();
        act(() => result.current.addRow("files"));
        await act(() => result.current.save(submitEvent()));

        // when
        act(() => result.current.reset());

        // then
        expect(result.current.rows?.files.map(row => row.extension)).toEqual(["WAD", "DEH"]);
        expect(result.current.error).toBeNull();
        expect(result.current.saved).toBe(false);
    });
});

describe("useWadValidationForm save", () => {
    it("sends the headers URI encoded and an empty header as null", async () => {
        // given
        const { result } = setup();
        const event = submitEvent();
        act(() => result.current.updateRow("files", 1, { header: "#DEH" }));
        act(() => result.current.addRow("files"));
        act(() => result.current.updateRow("files", 2, { extension: " BEX " }));

        // when
        await act(() => result.current.save(event));

        // then
        expect(event.preventDefault).toHaveBeenCalled();
        expect(mocks.save).toHaveBeenCalledWith({
            allowedExtensions: ["WAD", "DEH", "BEX"],
            allowedHeaders: ["PWAD", "%23DEH", null],
            allowedExtensionsZip: ["ZIP"],
            allowedHeadersZip: ["PK%03%04"],
        });
    });

    it("reports the save as done once the server accepts it", async () => {
        // given
        const { result } = setup();

        // when
        await act(() => result.current.save(submitEvent()));

        // then
        expect(result.current.saved).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("refuses to save a row without an extension", async () => {
        // given
        const { result } = setup();
        act(() => result.current.addRow("zips"));

        // when
        await act(() => result.current.save(submitEvent()));

        // then
        expect(result.current.error).toBe("Every row needs an extension");
        expect(mocks.save).not.toHaveBeenCalled();
    });

    it("drops the missing extension message once the rows change", async () => {
        // given
        const { result } = setup();
        act(() => result.current.addRow("zips"));
        await act(() => result.current.save(submitEvent()));

        // when
        act(() => result.current.updateRow("zips", 1, { extension: "7Z" }));

        // then
        expect(result.current.error).toBeNull();
    });

    it("hands back the server's message when saving fails", async () => {
        // given
        mocks.save.mockRejectedValue(new Error("Extensions and headers must contain equal entries"));
        const { result } = setup();

        // when
        await act(() => result.current.save(submitEvent()));

        // then
        expect(result.current.error).toBe("Extensions and headers must contain equal entries");
        expect(result.current.saved).toBe(false);
    });

    it("says the rules could not be saved when the failure carries no message", async () => {
        // given
        mocks.save.mockRejectedValue({});
        const { result } = setup();

        // when
        await act(() => result.current.save(submitEvent()));

        // then
        expect(result.current.error).toBe("Could not save the validation rules.");
    });

    it("reports saving while the request is in flight", () => {
        // given
        mocks.saving = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.saving).toBe(true);
    });
});
