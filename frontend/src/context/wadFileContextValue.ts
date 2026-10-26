import { createContext, type Dispatch, type SetStateAction } from "react";

export type WadFileState = {
    file: File | null;
    error: string | null;
    mapNames: string[];
    mapError: string | null;
};

type WadFileContextValue = readonly [WadFileState, Dispatch<SetStateAction<WadFileState>>];

export const EMPTY_WAD_FILE: WadFileState = { file: null, error: null, mapNames: [], mapError: null };

export const WadFileContext = createContext<WadFileContextValue | null>(null);
