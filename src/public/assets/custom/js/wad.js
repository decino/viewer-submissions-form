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

        function getLumpName(wadData, offset, lumpIndex) {
            let lumpName = "";

            const lumpOffset = offset + (lumpIndex * lumpSize) + 8;
            for (let index = 0; index < 8; index++) {
                lumpName += String.fromCharCode(wadData.getUint8(lumpOffset + index));
            }

            return lumpName;
        }

        function lineFilter(line) {
            return line.split(" ")[0].toUpperCase() === "MAP";
        }

        function sanitiseString(map) {
            return map.trim().replace(/\0/g, '').replace(/(\r\n|\n|\r)/gm, "").replace(/['"]+/g, '');
        }

        function getMapFromLumps(wadData, numLumps, offset) {
            const retArr = [];

            let lump = 0;
            while (lump < numLumps) {
                const candidateMapName = getLumpName(wadData, offset, lump++);
                let numMandatoryFound = 0;
                while (lump < numLumps) {
                    const lumpName = sanitiseString(getLumpName(wadData, offset, lump++));
                    const isMandatory = MapLumps[lumpName] ?? null;
                    if (isMandatory === null) {
                        lump--; // Backtrack
                        break;
                    } else if (isMandatory) {
                        numMandatoryFound++;
                        if (numMandatoryFound === 5) {
                            retArr.push(sanitiseString(candidateMapName));
                        }
                    }
                }
            }

            return retArr;
        }

        function getMapFromMapInfo(wadData) {
            let mapString = "";

            for (let mapChar = 0; mapChar < mapFormatSize; mapChar++) {
                mapString += String.fromCharCode(wadData.getUint8(mapFormatPos + mapChar));
            }
            const lines = mapString.split('\n');

            return lines
                .filter(line => lineFilter(line))
                .map(line => {
                    let mapName = line.slice(4);
                    // FIXME: Sometimes MAPINFO looks up existing DEH strings,
                    // in that case omit the map name completely and use the map slot instead.
                    if (line.includes("lookup")) {
                        mapName = line.split(" ")[1];
                    }
                    return sanitiseString(mapName.replace('{', ''));
                });
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

        function getMapFromDehacked(wadData) {

            let dehString = "";

            for (let dehChar = 0; dehChar < mapFormatSize; dehChar++) {
                dehString += String.fromCharCode(wadData.getUint8(mapFormatPos + dehChar));
            }
            const lines = dehString.split('\n');
            return lines.filter(line => line.includes("HUSTR_"))
                .map(line => {
                    let mapName = line.split("=")[1]?.trim();
                    // const mapNumber = line.split("_")[1];
                    if (mapName[0] === " ") { // Some people and their inconsistent spaces...
                        mapName = mapName.slice(1);
                    }
                    // FIXME: Some mappers don't add the map number in the DEH string. Cringe.
                    return sanitiseString(mapName);
                });
        }

        return {
            getMapFromLumps,
            getMapFromMapInfo,
            getMapFromUmapInfo,
            getMapFromDehacked
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

            const position = wadData.getInt32(lumpOffset, true);
            const size     = wadData.getInt32(lumpOffset + 4, true);
            const name     = readString(wadData, lumpOffset + 8, 8).replace(/\0/g, "");

            lumpTable.push({name, position, size});
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

    function getMapNames(lumpTable, mapNameFormats) {
        console.log("getMapFromLumps");

        if(mapNameFormats["MAPINFO"]) {
            console.log("getMapFromMapInfo");
        } else if(mapNameFormats["MAPINFO"]) {
            console.log("getMapFromUmapInfo");
        } else if(mapNameFormats["MAPINFO"]) {
            console.log("getMapFromDehacked");
        }
    }

    function processWad(wadData) {
        const header = readHeader(wadData);

        const lumpTable = readLumpTable(wadData, header);

        const mapNameFormats = findMapNameFormats(lumpTable);

        return getMapNames(lumpTable, mapNameFormats);
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
