export function idgamesUrl(value: string): string | null {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    if (!url.hostname.includes("doomworld.com") || !url.pathname.includes("idgames")) {
        return null;
    }

    return url.toString();
}

export function extractIdgamesTitle(html: string): string | null {
    const page = new DOMParser().parseFromString(html, "text/html");
    const title = page
        .getElementsByClassName("filelist")[0]
        ?.querySelector("tbody > tr > td:nth-child(2)")
        ?.textContent?.trim();

    return title ? title : null;
}
