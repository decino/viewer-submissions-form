import { type PropsWithChildren, useMemo, useState } from "react";
import { EMPTY_WAD_FILE, WadFileContext, type WadFileState } from "./wadFileContextValue";

export function WadFileProvider({ children }: PropsWithChildren) {
    const [state, setState] = useState<WadFileState>(EMPTY_WAD_FILE);

    const value = useMemo(() => [state, setState] as const, [state]);

    return <WadFileContext.Provider value={value}>{children}</WadFileContext.Provider>;
}
