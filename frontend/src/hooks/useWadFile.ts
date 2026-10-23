import { type ChangeEvent, useCallback, useContext, useRef } from "react";
import { EMPTY_WAD_FILE, WadFileContext } from "../context/wadFileContextValue";
import { WadMapAnalyser } from "../domain/wad/wad";
import { errorMessage } from "../utils/errorMessage";

const BYTES_PER_MB = 1048576;

type MapReading = {
    maps: string[];
    error: string | null;
};

async function readMapNames(file: File): Promise<MapReading> {
    try {
        const analyser = await WadMapAnalyser.create(file);

        return { maps: analyser.mapNames, error: null };
    } catch (failure) {
        return { maps: [], error: errorMessage(failure, "no reason was given") };
    }
}

type WadFileOptions = {
    limitMb: number | null;
    setLevel: (level: string) => void;
};

export function useWadFile({ limitMb, setLevel }: WadFileOptions) {
    const context = useContext(WadFileContext);
    if (!context) {
        throw new Error("useWadFile must be used within a WadFileProvider");
    }

    const [{ file, error, mapNames, mapError }, setState] = context;
    const chosenFile = useRef<File | null>(file);

    const fileInput = useCallback(
        (input: HTMLInputElement | null) => {
            if (!input || !file || input.files?.[0] === file) {
                return;
            }

            const transfer = new DataTransfer();
            transfer.items.add(file);
            input.files = transfer.files;
        },
        [file],
    );

    function clear() {
        if (mapNames.length > 0) {
            setLevel("");
        }

        chosenFile.current = null;
        setState(EMPTY_WAD_FILE);
    }

    async function choose(event: ChangeEvent<HTMLInputElement>) {
        const chosen = event.target.files?.[0] ?? null;

        clear();

        if (!chosen) {
            return;
        }

        if (limitMb !== null && chosen.size > limitMb * BYTES_PER_MB) {
            event.target.value = "";
            setState({ ...EMPTY_WAD_FILE, error: `That file is larger than ${limitMb} MB` });
            return;
        }

        chosenFile.current = chosen;
        setState({ ...EMPTY_WAD_FILE, file: chosen });

        if (!chosen.name.toLowerCase().endsWith(".wad")) {
            return;
        }

        const reading = await readMapNames(chosen);
        if (chosenFile.current !== chosen) {
            return;
        }

        if (reading.error !== null) {
            setState(previous => ({ ...previous, mapError: reading.error }));
            return;
        }

        setState(previous => ({ ...previous, mapNames: reading.maps }));
        if (reading.maps.length > 0) {
            setLevel(reading.maps[0]);
        }
    }

    return { file, error, mapNames, mapError, fileInput, choose, clear };
}
