class WadMapTokenizer {
    #tokens;

    constructor(lines) {
        this.#tokens = this.#init(lines);
    }

    * #init(lines) {
        let i = 0;
        while (i < lines.length) {
            let line = lines[i++].trim();

            // Handle text, string, "{", "}", "=", ","
            while (line.length > 0) {
                // Keep quoted text together. If end quote is missing, do nothing.
                if (line.startsWith('"')) {
                    const end = line.indexOf('"', 1);
                    if (end > 0) {
                        yield ["text", line.slice(1, end)];
                        line = line.slice(end + 1).trim();
                        continue;
                    }
                }

                if (line[0] === '{' || line[0] === '}' || line[0] === '=' || line[0] === ',') {
                    yield ["symbol", line[0]];
                    line = line.slice(1).trim();
                    continue;
                }

                const space = line.indexOf(" ");
                if (space > 0) {
                    yield ["text", line.slice(0, space)];
                    line = line.slice(space + 1).trim();
                    continue;
                }

                // Last token on line.
                yield ["text", line];
                break;
            }
            yield ["symbol", "newline"];
        }
    }


    * mapNameExtractorForUMAPINFO() {
        // Only one of these is ever non-zero at the same time
        let insideDeclarationState = 0; // 1 = "MAP" seen, 2 = map slot seen, 3+ = unknown token (ignore)
        let insideBlockState = 0; // 1 = "{" seen, 2 = (part of) key seen, 3 = '=' seen, 4 = (part of) value seen

        let mapSlot = "";
        let key = "";
        let value = "";
        let error = false;

        for (const token of this.#tokens) {
            if (insideDeclarationState > 0) {
                if (token[0] === "symbol") {
                    if (token[1] === "{") {
                        insideDeclarationState = 0;
                        insideBlockState = 1;
                        continue;
                    } else if (token[1] === "newline") {
                        insideDeclarationState = 0;
                        continue;
                    }
                }

                if (insideDeclarationState === 1) {
                    if (token[0] === "text") {
                        mapSlot = token[1];
                        insideDeclarationState = 2;
                    } else {
                        insideDeclarationState = 0;
                        mapSlot = "";
                    }
                }
            } else if (insideBlockState > 0) {
                if (token[0] === "symbol") {
                    if (token[1] === "}" || token[1] === "newline") {
                        if (mapSlot.length > 0 && key.toLocaleLowerCase() === "levelname" && value.length > 0) {
                            yield [mapSlot.toUpperCase(), value];
                        }

                        key = "";
                        value = "";

                        if (token[1] === "}") {
                            insideBlockState = 0;
                            mapSlot = "";
                        } else {
                            insideBlockState = 1;
                        }

                        continue;
                    } else if (token[1] === "newline") {
                        insideBlockState = 1;
                        key = "";
                        value = "";
                        continue;
                    }
                }

                error = false;
                switch (insideBlockState) {
                    case 1:
                        if (token[0] === "text") {
                            key = token[1];
                            insideBlockState = 2;
                        } else {
                            error = true;
                        }
                        break;
                    case 2:
                        if (token[0] === "text") {
                            key += " " + token[1];
                        } else if (token[1] === '=') {
                            insideBlockState = 3;
                        } else {
                            error = true;
                        }
                        break;
                    case 3:
                        if (token[0] === "text") {
                            value = token[1];
                            insideBlockState = 4;
                        } else {
                            error = true;
                        }
                        break;
                    case 4:
                        if (token[0] === "text") {
                            value += " " + token[1];
                        } else {
                            error = true;
                        }
                        break;
                }

                if (error) {
                    insideBlockState = 1;
                    key = "";
                    value = "";
                }
            } else {
                if (token[0] === "text" && token[1].toUpperCase() === "MAP") {
                    insideDeclarationState = 1;
                }
                if (token[0] === "symbol" && token[1] === "{") {
                    insideBlockState = 1;
                }
            }
        }
    }

}


class WadReader {
    header;
    lumpTable;
    #fileData;

    constructor(data) {
        this.#fileData = data;
        this.#init();
    }

    #init() {
        this.header = this.#readHeader();
        this.lumpTable = this.#readLumpTable();
    }

    #readHeader() {
        if (this.#fileData.byteLength < 12) {
            throw new Error("Error: File too small to contain a header");
        }

        const identification = this.readString(0, 4);
        if (identification !== "IWAD" && identification !== "PWAD") {
            throw new Error("Error: not a IWAD or PWAD");
        }

        const numLumps = this.#fileData.getInt32(4, true);
        const infoTableOffset = this.#fileData.getInt32(8, true);

        if (this.#fileData.byteLength < infoTableOffset + numLumps * 16) {
            throw new Error("Error: Header corrupt or file truncated");
        }

        return {identification, numLumps, infoTableOffset};
    }

    readString(offset, length) {
        let string = "";

        for (let index = 0; index < length; index++) {
            string += String.fromCharCode(this.#fileData.getUint8(offset + index));
        }

        return string;
    }

    #readLumpTable() {
        const lumpTable = [];
        const header = this.header;
        const wadData = this.#fileData;
        for (let lumpIndex = 0; lumpIndex < header.numLumps; lumpIndex++) {
            const lumpOffset = header.infoTableOffset + lumpIndex * 16;

            const offset = wadData.getInt32(lumpOffset, true);
            const length = wadData.getInt32(lumpOffset + 4, true);
            const name = this.readString(lumpOffset + 8, 8).replace(/\0/g, "");

            lumpTable.push({name, offset, length});
        }

        return lumpTable;
    }

}


class WadMapAnalyser extends WadReader {
    static #isInternalConstructing = false;

    #MapLumps = {
        THINGS: true,
        LINEDEFS: true,
        SIDEDEFS: true,
        VERTEXES: true,
        SECTORS: true,
        SEGS: false,
        SSECTORS: false,
        NODES: false,
        REJECT: false,
        BLOCKMAP: false,
    };


    constructor(data) {
        super(data);
        if (!WadMapAnalyser.#isInternalConstructing) {
            throw new TypeError("PrivateConstructor is not constructable");
        }
        WadMapAnalyser.#isInternalConstructing = false;
    }

    get mapNames() {
        const mapNameFormats = this.#findMapNameFormats();
        return this.#getMapNames(mapNameFormats);
    }

    static create(file) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        return new Promise((resolve) => {
            reader.onloadend = (event) => {
                if (event.target.readyState === FileReader.DONE) {
                    const data = event.target.result;
                    WadMapAnalyser.#isInternalConstructing = true;
                    resolve(new WadMapAnalyser(new DataView(data)));
                }
            };
        });
    }

    #findMapNameFormats() {
        const mapNameFormats = {};
        const lumpTable = this.lumpTable;
        for (let i = 0; i < lumpTable.length; i++) {
            if (lumpTable[i].name === "DEHACKED" ||
                lumpTable[i].name === "MAPINFO" ||
                lumpTable[i].name === "UMAPINFO") {
                mapNameFormats[lumpTable[i].name] = lumpTable[i];
            }
        }

        return mapNameFormats;
    }

    #getMapFromLumps() {
        const maps = {};

        let lump = 0;
        while (lump < this.lumpTable.length) {
            const candidateMapSlot = this.lumpTable[lump++].name;

            let numMandatoryFound = 0;
            while (lump < this.lumpTable.length) {
                const lumpName = this.lumpTable[lump++].name;

                const mapLumpIsMandatory = this.#MapLumps[lumpName] ?? null;
                if (mapLumpIsMandatory === null) {
                    lump--; // Not a map lump. Backtrack and use it as a new candidate map slot.
                    break;
                } else if (mapLumpIsMandatory) {
                    numMandatoryFound++;
                    if (numMandatoryFound === 5) {
                        maps[candidateMapSlot] = candidateMapSlot;
                    }
                }
            }
        }

        return maps;
    }

    #getMapFromDEHACKED(dehLump, maps) {
        const dehString = this.readString(dehLump.offset, dehLump.length);

        const lines = dehString.split('\n');

        lines.filter(line => line.includes("HUSTR_"))
            .forEach(line => {
                const split = line.indexOf("=");
                const hustr = line.slice(0, split).trim();
                const mapName = line.slice(split + 1).trim();

                // One leading zero:
                //   1 -> MAP01
                //  12 -> MAP12
                // 123 -> MAP123
                const mapSlot = "MAP" + hustr.slice(6).padStart(2, "0");
                if (!maps[mapSlot]) {
                    return;
                }

                maps[mapSlot] = mapName;
            });
    }

    #getMapFromMAPINFO(mapiLump, maps) {
        const mapiString = this.readString(mapiLump.offset, mapiLump.length);

        const lines = mapiString.split('\n');

        // This only parses the ZDOOM formats.
        // TODO: Implement MAPINFO Hexen format
        // TODO: Implement MAPINFO Eternity format
        // TODO: Implement MAPINFO Doomsday format

        lines.map(line => line.trim())
            .filter(line => line.slice(0, 4).toUpperCase() === "MAP ")
            .map(line => line.slice(4).trim())
            .forEach(line => {
                // TODO: Sometimes MAPINFO looks up DEH strings, so read DEH first and pass it to this function
                // TODO: Find example wad
                // For now, keep the map slot as the name.
                if (line.includes("lookup")) {
                    return;
                }

                const space = line.indexOf(" ");
                const mapSlot = line.slice(0, space).toUpperCase();
                if (!maps[mapSlot]) {
                    return;
                }

                let mapName = line.slice(space + 1).trim();

                if (mapName[0] === '"') {
                    // Extract name from quotes
                    for (let i = 1; i < mapName.length; i++) {
                        if (mapName[i] === '"') {
                            mapName = mapName.slice(1, i).trim();
                            break;
                        }
                    }
                } else {
                    // Remove start of the optional data block
                    const brace = mapName.indexOf("{");
                    if (brace > 0) {
                        mapName = mapName.slice(0, brace).trim();
                    }
                }

                maps[mapSlot] = mapName;
            });
    }

    #removeQuotesIfNecessary(maps) {
        Object.keys(maps)
            .map(mapSlot => {
                const mapName = maps[mapSlot];
                if (mapName[0] === '"' && mapName[mapName.length - 1] === '"') {
                    maps[mapSlot] = mapName.slice(1, mapName.length - 1);
                }
            });

        return maps;
    }

    #addMapSlotsToNameIfNecessary(maps) {
        Object.keys(maps)
            .map(mapSlot => {
                const mapName = maps[mapSlot];
                if (!mapName.toUpperCase().includes(mapSlot.toUpperCase())) {
                    maps[mapSlot] = mapSlot + ": " + mapName;
                }
            });

        return maps;
    }

    #getMapFromUMAPINFO(umapLump, maps) {
        const umapString = this.readString(umapLump.offset, umapLump.length);

        const lines = umapString.split('\n');
        const wadTokenizer = new WadMapTokenizer(lines);
        const mapSlotsAndNames = wadTokenizer.mapNameExtractorForUMAPINFO();

        for (const mapSlotAndName of mapSlotsAndNames) {
            if (maps[mapSlotAndName[0]]) {
                maps[mapSlotAndName[0]] = mapSlotAndName[1];
            }
        }
    }

    #getMapNames(mapNameFormats) {
        const maps = this.#getMapFromLumps();

        if (mapNameFormats["DEHACKED"]) {
            this.#getMapFromDEHACKED(mapNameFormats["DEHACKED"], maps);
        }

        if (mapNameFormats["MAPINFO"]) {
            this.#getMapFromMAPINFO(mapNameFormats["MAPINFO"], maps);
        }

        if (mapNameFormats["UMAPINFO"]) {
            this.#getMapFromUMAPINFO(mapNameFormats["UMAPINFO"], maps);
        }

        this.#removeQuotesIfNecessary(maps);
        this.#addMapSlotsToNameIfNecessary(maps);

        // Discard map slots, keep names.
        // Maps for which no name was found have the slot as the name.
        return Object.values(maps);
    }

}
