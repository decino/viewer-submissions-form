interface DownloadLinkProps {
    url: string | null;
}

export function DownloadLink({ url }: DownloadLinkProps) {
    if (!url) {
        return "N/A";
    }

    return (
        <a href={url} target="_blank" rel="noreferrer">
            Download
        </a>
    );
}
