const WadAnalyser = (function () {
    const lumpSize = 16;
    const MapNameFormat = {
        MAPINFO: 0,
        UMAPINFO: 1,
        DEHACKED: 2,
        LUMP: 3,
    };
    const MapLumps = {
        THINGS  : true,
        LINEDEFS: true,
        SIDEDEFS: true,
        VERTEXES: true,
        SECTORS : true,
        SEGS    : false,
        SSECTORS: false,
        NODES   : false,
        REJECT  : false,
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

        function searchMapNameFormat(wadData, numLumps, offset) {
            const found = [];
            for (let lump = 0; lump < numLumps; lump++) {
                let name = "";

                const lumpOffset = offset + (lump * lumpSize);
                const position = wadData.getInt32(lumpOffset, true);
                const size = wadData.getInt32(lumpOffset + 4, true);

                for (let index = 0; index < 8; index++) {
                    name += String.fromCharCode(wadData.getUint8(lumpOffset + 8 + index));
                }
                if (name === "MAPINFO\0") {
                    found.push({
                        format: MapNameFormat.MAPINFO,
                        position,
                        size
                    });
                } else if (name === "UMAPINFO") {
                    found.push({
                        format: MapNameFormat.UMAPINFO,
                        position,
                        size
                    });
                } else if (name === "DEHACKED") {
                    found.push({
                        format: MapNameFormat.DEHACKED,
                        position,
                        size
                    });
                }
            }
            if (found.length > 0) {
                const itm = found.sort((a, b) =>
                    a.format - b.format
                ).shift();
                mapFormatPos = itm.position;
                mapFormatSize = itm.size;
                return itm.format;
            }
            return MapNameFormat.LUMP;

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

        function getLumpName(wadData, offset, lumpIndex) {
            let lumpName = "";

            const lumpOffset = offset + (lumpIndex * lumpSize) + 8;
            for (let index = 0; index < 8; index++) {
                lumpName += String.fromCharCode(wadData.getUint8(lumpOffset + index));
            }

            return lumpName;
        }

        function getMapFromLumps(wadData, numLumps, offset) {
            const retArr = [];

            let lump = 0;
            while (lump < numLumps) {
                const candidateMapName  = getLumpName(wadData, offset, lump++);
                let   numMandatoryFound = 0;
                while (lump < numLumps) {
                    const lumpName    = sanitiseString(getLumpName(wadData, offset, lump++));
                    const isMandatory = MapLumps[lumpName];
                    if (isMandatory === undefined) {
                        lump--; // Backtrack
                        break;
                    } else if (isMandatory) {
                        numMandatoryFound++;
                        if (numMandatoryFound == 5) {
                            retArr.push(sanitiseString(candidateMapName));
                        }
                    }
                }
            }

            return retArr;
        }

        return {
            searchMapNameFormat,
            getMapFromMapInfo,
            getMapFromUmapInfo,
            getMapFromDehacked,
            getMapFromLumps
        };
    }());

    function processWad(wadData) {
        // wadinfo_t
        // 0x00 identification (4 bytes)
        // 0x04 numlumps (4 bytes)
        // 0x08 infotableofs (4 bytes)
        let identification = "";

        for (let index = 0; index < 4; index++) {
            identification += String.fromCharCode(wadData.getUint8(index));
        }
        if (identification !== "PWAD" && identification !== "IWAD") {
            throw new Error("Error: not a PWAD or IWAD");
        }
        const numLumps = wadData.getInt32(4, true);
        const offset = wadData.getInt32(8, true);

        const mapNameFormatType = MapProcessor.searchMapNameFormat(wadData, numLumps, offset);

        switch (mapNameFormatType) {
            case MapNameFormat.MAPINFO:
                return MapProcessor.getMapFromMapInfo(wadData);
            case MapNameFormat.UMAPINFO:
                return MapProcessor.getMapFromUmapInfo(wadData);
            case MapNameFormat.DEHACKED:
                return MapProcessor.getMapFromDehacked(wadData);
            default:
                return MapProcessor.getMapFromLumps(wadData, numLumps, offset);
        }
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
