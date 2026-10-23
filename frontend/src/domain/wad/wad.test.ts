import { describe, expect, it } from "vitest";
import { WadMapAnalyser } from "./wad";

interface TestLump {
    name: string;
    data?: string;
}

const MANDATORY_LUMPS = ["THINGS", "LINEDEFS", "SIDEDEFS", "VERTEXES", "SECTORS"];
const FULL_MAP_LUMPS = [...MANDATORY_LUMPS, "SEGS", "SSECTORS", "NODES", "REJECT", "BLOCKMAP"];

function writeText(view: DataView, offset: number, text: string): void {
    for (let index = 0; index < text.length; index++) {
        view.setUint8(offset + index, text.charCodeAt(index));
    }
}

function buildWad(lumps: readonly TestLump[], identification = "PWAD"): ArrayBuffer {
    const dataSize = lumps.reduce((total, lump) => total + (lump.data ?? "").length, 0);
    const tableOffset = 12 + dataSize;
    const buffer = new ArrayBuffer(tableOffset + lumps.length * 16);
    const view = new DataView(buffer);

    writeText(view, 0, identification);
    view.setInt32(4, lumps.length, true);
    view.setInt32(8, tableOffset, true);

    let offset = 12;
    for (const [index, lump] of lumps.entries()) {
        const data = lump.data ?? "";
        const entry = tableOffset + index * 16;

        writeText(view, offset, data);
        view.setInt32(entry, offset, true);
        view.setInt32(entry + 4, data.length, true);
        writeText(view, entry + 8, lump.name);
        offset += data.length;
    }

    return buffer;
}

function mapLumps(slot: string, lumpNames: readonly string[] = FULL_MAP_LUMPS): TestLump[] {
    return [{ name: slot }, ...lumpNames.map(name => ({ name }))];
}

async function mapNamesOf(buffer: ArrayBuffer): Promise<string[]> {
    const analyser = await WadMapAnalyser.create(new Blob([buffer]));

    return analyser.mapNames;
}

describe("WadMapAnalyser", () => {
    it("lists every map slot in the WAD, sorted by name", async () => {
        // given
        const wad = buildWad([...mapLumps("MAP02"), ...mapLumps("MAP01")]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01", "MAP02"]);
    });

    it("finds Doom 1 episode slots", async () => {
        // given
        const wad = buildWad([...mapLumps("E1M2"), ...mapLumps("E1M1")]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["E1M1", "E1M2"]);
    });

    it("accepts a map that only has the five mandatory lumps", async () => {
        // given
        const wad = buildWad(mapLumps("MAP01", MANDATORY_LUMPS));

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01"]);
    });

    it("skips a marker that is missing one of the mandatory lumps", async () => {
        // given
        const wad = buildWad([
            ...mapLumps("MAP01", ["THINGS", "LINEDEFS", "SIDEDEFS", "VERTEXES"]),
            ...mapLumps("MAP02"),
        ]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP02"]);
    });

    it("reads an IWAD as well as a PWAD", async () => {
        // given
        const wad = buildWad(mapLumps("MAP01"), "IWAD");

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01"]);
    });

    it("returns no maps for a WAD without any map lumps", async () => {
        // given
        const wad = buildWad([
            { name: "PLAYPAL", data: "palette" },
            { name: "DEHACKED", data: "HUSTR_1 = Entryway" },
        ]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual([]);
    });

    it.each([
        {
            problem: "a file too small to hold a header",
            buffer: new ArrayBuffer(8),
            message: "Error: File too small to contain a header",
        },
        {
            problem: "a file that is neither an IWAD nor a PWAD",
            buffer: buildWad(mapLumps("MAP01"), "ZWAD"),
            message: "Error: not a IWAD or PWAD",
        },
        {
            problem: "a lump table that runs past the end of the file",
            buffer: buildWad(mapLumps("MAP01")).slice(0, 12 + 16 * 5),
            message: "Error: Header corrupt or file truncated",
        },
    ])("rejects $problem", async ({ buffer, message }) => {
        // then
        await expect(mapNamesOf(buffer)).rejects.toThrow(message);
    });

    it("names maps from the DEHACKED level names", async () => {
        // given
        const dehacked = "[STRINGS]\r\nHUSTR_1 = Entryway\r\nHUSTR_2 = Underhalls\r\nHUSTR_3 = The Gantlet\r\n";
        const wad = buildWad([...mapLumps("MAP01"), ...mapLumps("MAP02"), { name: "DEHACKED", data: dehacked }]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01: Entryway", "MAP02: Underhalls"]);
    });

    it("strips the quotes around a DEHACKED level name", async () => {
        // given
        const wad = buildWad([...mapLumps("MAP01"), { name: "DEHACKED", data: 'HUSTR_1 = "Entryway"' }]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01: Entryway"]);
    });

    it("names maps from MAPINFO and leaves lookups on the slot name", async () => {
        // given
        const mapinfo = ['map MAP01 "Hangar"', "{", "}", 'map MAP02 lookup "HUSTR_2"', "MAP MAP03 Toxin {", "}"].join(
            "\n",
        );
        const wad = buildWad([
            ...mapLumps("MAP01"),
            ...mapLumps("MAP02"),
            ...mapLumps("MAP03"),
            { name: "MAPINFO", data: mapinfo },
        ]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01: Hangar", "MAP02", "MAP03: Toxin"]);
    });

    it("names maps from the UMAPINFO level names", async () => {
        // given
        const umapinfo = [
            "MAP MAP01",
            "{",
            '    levelname = "The Gantlet"',
            '    music = "D_RUNNIN"',
            "}",
            "map MAP02 {",
            '    levelname = "Dead Simple"',
            "}",
        ].join("\n");
        const wad = buildWad([...mapLumps("MAP01"), ...mapLumps("MAP02"), { name: "UMAPINFO", data: umapinfo }]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01: The Gantlet", "MAP02: Dead Simple"]);
    });

    it("prefers UMAPINFO over MAPINFO, and MAPINFO over DEHACKED, wherever the lumps sit", async () => {
        // given
        const wad = buildWad([
            { name: "UMAPINFO", data: 'MAP MAP03\n{\nlevelname = "Umap three"\n}' },
            { name: "MAPINFO", data: 'map MAP02 "Info two"\nmap MAP03 "Info three"' },
            ...mapLumps("MAP01"),
            ...mapLumps("MAP02"),
            ...mapLumps("MAP03"),
            { name: "DEHACKED", data: "HUSTR_1 = Deh one\nHUSTR_2 = Deh two\nHUSTR_3 = Deh three" },
        ]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["MAP01: Deh one", "MAP02: Info two", "MAP03: Umap three"]);
    });

    it("does not repeat the slot when the name already contains it", async () => {
        // given
        const wad = buildWad([...mapLumps("MAP01"), { name: "MAPINFO", data: 'map MAP01 "map01 Entryway"' }]);

        // when
        const names = await mapNamesOf(wad);

        // then
        expect(names).toEqual(["map01 Entryway"]);
    });
});
