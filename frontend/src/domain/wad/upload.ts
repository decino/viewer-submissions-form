export function acceptAttribute(extensions: readonly string[]): string {
    return extensions.map(extension => `.${extension}`).join(",");
}
