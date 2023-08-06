const WadAnalyser = (function () {
    const lumpSize = 16;
    const MapNameFormat = {
        MAPINFO: 0,
        UMAPINFO: 1,
        DEHACKED: 2,
        LUMP: 3,
    };
    const MapLumps = {
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

    const MapProcessor = (function () {

        let mapFormatPos = 0;
        let mapFormatSize = 0;

        function lineFilter(line) {
            return line.split(" ")[0].toUpperCase() === "MAP";
        }

        function sanitiseString(map) {
            return map.trim().replace(/\0/g, '').replace(/(\r\n|\n|\r)/gm, "").replace(/['"]+/g, '');
        }

        function getMapFromUmapInfo(wadData) {
            let mapString = "";

            for (let mapChar = 0; mapChar < mapFormatSize; mapChar++) {
                mapString += String.fromCharCode(wadData.getUint8(mapFormatPos + mapChar));
            }
            const lines = mapString.split('\n');
            const retArr = [];
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex];
                if (lineFilter(line)) {
                    let mapName = line.split(" ")[1] + ": ";
                    while (!line.includes("}")) {
                        lineIndex++;
                        line = lines[lineIndex];

                        let levelName = line.split("=");

                        if (levelName[0].includes("levelname")) {
                            mapName += levelName[1];
                            break;
                        }
                    }
                    retArr.push(sanitiseString(mapName));
                }
            }
            return retArr;
        }

        return {
            getMapFromUmapInfo,
        };
    }());

    function readString(wadData, offset, length) {
        let string = "";

        for (let index = 0; index < length; index++) {
            string += String.fromCharCode(wadData.getUint8(offset + index));
        }

        return string;
    }

    function readHeader(wadData) {
        if (wadData.byteLength < 12) {
            throw new Error("Error: File too small to contain a header");
        }

        // wadinfo_t
        // 0x00 identification (4 bytes)
        // 0x04 numLumps (4 bytes)
        // 0x08 infoTableoffset (4 bytes)

        const identification = readString(wadData, 0, 4);
        console.log(`file size: ${wadData.byteLength}l, identification: ${identification}`); // TODO remove debug lines

        if (identification !== "IWAD" && identification !== "PWAD") {
            throw new Error("Error: not a IWAD or PWAD");
        }

        const numLumps        = wadData.getInt32(4, true);
        const infoTableoffset = wadData.getInt32(8, true);
        console.log(`numLumps: ${numLumps}, infoTableoffset: ${infoTableoffset}`); // TODO remove debug lines

        if (wadData.byteLength < infoTableoffset + numLumps * 16) {
            throw new Error("Error: Header corrupt or file truncated");
        }

        return {identification, numLumps, infoTableoffset};
    }

    function readLumpTable(wadData, header) {
        lumpTable = [];

        for (let lumpIndex = 0; lumpIndex < header.numLumps; lumpIndex++) {
            const lumpOffset = header.infoTableoffset + lumpIndex * 16;

            const offset = wadData.getInt32(lumpOffset, true);
            const length = wadData.getInt32(lumpOffset + 4, true);
            const name   = readString(wadData, lumpOffset + 8, 8).replace(/\0/g, "");

            lumpTable.push({name, offset, length});
        }

        return lumpTable;
    }

    function findMapNameFormats(lumpTable) {
        const mapNameFormats = {};

        for (let i = 0; i < lumpTable.length; i++) {
            if (lumpTable[i].name === "DEHACKED" ||
                lumpTable[i].name === "MAPINFO" ||
                lumpTable[i].name === "UMAPINFO") {
                mapNameFormats[lumpTable[i].name] = lumpTable[i];
            }
        }

        console.table(mapNameFormats); // TODO remove debug lines
        return mapNameFormats;
    }

    function getMapFromLumps(lumpTable) {
        const maps = {};

        let lump = 0;
        while (lump < lumpTable.length) {
            const candidateMapSlot = lumpTable[lump++].name;

            let numMandatoryFound = 0;
            while (lump < lumpTable.length) {
                const lumpName = lumpTable[lump++].name;

                const mapLumpIsMandatory = MapLumps[lumpName] ?? null;
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

    function getMapFromDEHACKED(wadData, dehLump, maps) {
        const dehString = readString(wadData, dehLump.offset, dehLump.length);

        const lines = dehString.split('\n');
        console.table(lines); // TODO remove debug lines

        lines.filter(line => line.includes("HUSTR_"))
            .forEach(line => {
                const split   = line.indexOf("=");
                const hustr   = line.slice(0, split).trim();
                const mapName = line.slice(split + 1).trim();

                // One leading zero:
                //   1 -> MAP01
                //  12 -> MAP12
                // 123 -> MAP123
                const mapSlot = "MAP" + hustr.slice(6).padStart(2, "0");
                console.log(`mapSlot: ${mapSlot}, mapName: ${mapName}`); // TODO remove debug lines

                maps[mapSlot] = mapName;
            });
    }

    function getMapFromMAPINFO(wadData, mapiLump, maps) {
        const mapiString = readString(wadData, mapiLump.offset, mapiLump.length);

        const lines = mapiString.split('\n');
        console.table(lines); // TODO remove debug lines

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

                const space   = line.indexOf(" ");
                const mapSlot = line.slice(0, space).toUpperCase();
                if (!maps[mapSlot]) {
                    return;
                }

                let mapName = line.slice(space + 1).trim();

                if(mapName[0] === '"') {
                    // Extract name from quotes
                    for(let i = 1; i < mapName.length; i++) {
                        if (mapName[i] == '"') {
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
                console.log(`mapSlot: ${mapSlot}, mapName: ${mapName}`); // TODO remove debug lines

                maps[mapSlot] = mapName;
            });
    }

    function removeQuotesIfNecessary(maps) {
        Object.keys(maps)
            .map(mapSlot => {
                const mapName = maps[mapSlot];
                if(mapName[0] === '"' && mapName[mapName.length - 1] === '"') {
                    maps[mapSlot] = mapName.slice(1, mapName.length - 1);
                }
            });

        return maps;
    }

    // Add map slot to title, unless it it already happens to be part of the title
    function addMapSlotsToNameIfNecessary(maps) {
        Object.keys(maps)
            .map(mapSlot => {
                const mapName = maps[mapSlot];
                if (!mapName.toUpperCase().includes(mapSlot.toUpperCase())) {
                    maps[mapSlot] = mapSlot + ": " + mapName;
                }
            });

        return maps;
    }

    function getMapNames(wadData, lumpTable, mapNameFormats) {
        const maps = getMapFromLumps(lumpTable);

        if(mapNameFormats["DEHACKED"]) {
            getMapFromDEHACKED(wadData, mapNameFormats["DEHACKED"], maps);
        }

        if(mapNameFormats["MAPINFO"]) {
            getMapFromMAPINFO(wadData, mapNameFormats["MAPINFO"], maps);
        }

        // if(mapNameFormats["UMAPINFO"]) {
        //     console.log("getMapFromUmapInfo");
        // }

        removeQuotesIfNecessary(maps);
        addMapSlotsToNameIfNecessary(maps);

        // Discard map slots, keep names.
        // Maps for which no name was found have the slot as the name.
        // return Object.values(maps);
        return maps; // TODO remove debug lines
    }

    function processWad(wadData) {
        const header = readHeader(wadData);

        const lumpTable = readLumpTable(wadData, header);

        const mapNameFormats = findMapNameFormats(lumpTable);

        return getMapNames(wadData, lumpTable, mapNameFormats);
    }

    function readFile(file) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        return new Promise((resolve) => {
            reader.onloadend = (event) => {
                if (event.target.readyState === FileReader.DONE) {
                    const mapNames = processWad(new DataView(event.target.result));
                    resolve(mapNames);
                }
            };
        });
    }

    return {
        readFile
    };
}());
