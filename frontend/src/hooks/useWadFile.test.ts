import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fileEvent, makeFile } from "../test-utils/fixtures";
import { providerWrapper } from "../test-utils/render";
import { useWadFile } from "./useWadFile";

const mocks = vi.hoisted(() => ({
    wadMapNames: vi.fn(),
    setLevel: vi.fn(),
}));

vi.mock("../domain/wad/wad", () => ({
    WadMapAnalyser: {
        create: () =>
            Promise.resolve({
                get mapNames() {
                    return mocks.wadMapNames();
                },
            }),
    },
}));

function setup(limitMb: number | null = 2) {
    return renderHook(() => useWadFile({ limitMb, setLevel: mocks.setLevel }), { wrapper: providerWrapper() });
}

beforeEach(() => {
    mocks.setLevel.mockReset();
    mocks.wadMapNames.mockReset();
    mocks.wadMapNames.mockReturnValue([]);
});

describe("useWadFile", () => {
    it("starts with no file, no maps and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.file).toBeNull();
        expect(result.current.mapNames).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(result.current.mapError).toBeNull();
    });

    it("turns away a file larger than the upload limit, clears it and says why", async () => {
        // given
        const { result } = setup();
        const { event, target } = fileEvent(makeFile("sunlust.wad", 2 * 1048576 + 1));

        // when
        await act(() => result.current.choose(event));

        // then
        expect(target.value).toBe("");
        expect(result.current.file).toBeNull();
        expect(result.current.error).toBe("That file is larger than 2 MB");
        expect(mocks.wadMapNames).not.toHaveBeenCalled();
    });

    it("accepts a file right at the upload limit", async () => {
        // given
        const { result } = setup();
        const file = makeFile("sunlust.zip", 2 * 1048576);

        // when
        await act(() => result.current.choose(fileEvent(file).event));

        // then
        expect(result.current.error).toBeNull();
        expect(result.current.file).toBe(file);
    });

    it("accepts any size while the upload limit is unknown", async () => {
        // given
        const { result } = setup(null);

        // when
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.zip", 500 * 1048576)).event));

        // then
        expect(result.current.error).toBeNull();
    });

    it("offers the maps of a chosen WAD and sets the first one as the level", async () => {
        // given
        mocks.wadMapNames.mockReturnValue(["MAP01: Entryway", "MAP02: Underhalls"]);
        const { result } = setup();

        // when
        await act(() => result.current.choose(fileEvent(makeFile("SUNLUST.WAD")).event));

        // then
        expect(result.current.mapNames).toEqual(["MAP01: Entryway", "MAP02: Underhalls"]);
        expect(mocks.setLevel).toHaveBeenCalledWith("MAP01: Entryway");
    });

    it("leaves the level alone when the WAD has no maps", async () => {
        // given
        const { result } = setup();

        // when
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.wad")).event));

        // then
        expect(result.current.mapNames).toEqual([]);
        expect(mocks.setLevel).not.toHaveBeenCalled();
    });

    it("does not look for maps in a file that is not a WAD", async () => {
        // given
        const { result } = setup();

        // when
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.zip")).event));

        // then
        expect(mocks.wadMapNames).not.toHaveBeenCalled();
        expect(result.current.mapNames).toEqual([]);
    });

    it("says why the maps could not be read", async () => {
        // given
        mocks.wadMapNames.mockImplementation(() => {
            throw new Error("Not a valid WAD file");
        });
        const { result } = setup();

        // when
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.wad")).event));

        // then
        expect(result.current.mapError).toBe("Not a valid WAD file");
        expect(result.current.mapNames).toEqual([]);
    });

    it("says no reason was given when reading the maps fails without one", async () => {
        // given
        mocks.wadMapNames.mockImplementation(() => {
            throw new Error("");
        });
        const { result } = setup();

        // when
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.wad")).event));

        // then
        expect(result.current.mapError).toBe("no reason was given");
    });

    it("ignores the maps of a file that was replaced while they were being read", async () => {
        // given
        mocks.wadMapNames.mockReturnValueOnce(["MAP01: Entryway"]);
        const { result } = setup();
        const replaced = makeFile("sunlust.wad");
        const replacement = makeFile("scythe.zip");

        // when
        await act(async () => {
            const slowRead = result.current.choose(fileEvent(replaced).event);
            await result.current.choose(fileEvent(replacement).event);
            await slowRead;
        });

        // then
        expect(result.current.file).toBe(replacement);
        expect(result.current.mapNames).toEqual([]);
        expect(mocks.setLevel).not.toHaveBeenCalledWith("MAP01: Entryway");
    });

    it("forgets the file and its maps and clears the level it set", async () => {
        // given
        mocks.wadMapNames.mockReturnValue(["MAP01: Entryway"]);
        const { result } = setup();
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.wad")).event));

        // when
        act(() => result.current.clear());

        // then
        expect(result.current.file).toBeNull();
        expect(result.current.mapNames).toEqual([]);
        expect(mocks.setLevel).toHaveBeenLastCalledWith("");
    });

    it("keeps the chosen file and its maps in the provider, so a form mounted again still has them", async () => {
        // given
        mocks.wadMapNames.mockReturnValue(["MAP01: Entryway"]);
        const file = makeFile("sunlust.wad");
        const { result } = renderHook(
            () => [useWadFile({ limitMb: 2, setLevel: mocks.setLevel }), useWadFile({ limitMb: 2, setLevel: vi.fn() })],
            { wrapper: providerWrapper() },
        );

        // when
        await act(() => result.current[0].choose(fileEvent(file).event));

        // then
        expect(result.current[1].file).toBe(file);
        expect(result.current[1].mapNames).toEqual(["MAP01: Entryway"]);
    });

    it("refuses to work outside a WadFileProvider", () => {
        // then
        expect(() => renderHook(() => useWadFile({ limitMb: 2, setLevel: mocks.setLevel }))).toThrow(
            "useWadFile must be used within a WadFileProvider",
        );
    });

    it("leaves the level alone when cleared without maps", async () => {
        // given
        const { result } = setup();
        await act(() => result.current.choose(fileEvent(makeFile("sunlust.zip")).event));

        // when
        act(() => result.current.clear());

        // then
        expect(result.current.file).toBeNull();
        expect(mocks.setLevel).not.toHaveBeenCalled();
    });
});
