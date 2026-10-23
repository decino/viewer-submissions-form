import type { ChangeEvent } from "react";

interface FakeFileInput {
    files: File[];
    value: string;
}

export function makeFile(name: string, size = 1024): File {
    const file = new File(["PWAD"], name);
    Object.defineProperty(file, "size", { value: size });

    return file;
}

export function fileEvent(file: File) {
    const target: FakeFileInput = { files: [file], value: `C:\\fakepath\\${file.name}` };

    return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target };
}
