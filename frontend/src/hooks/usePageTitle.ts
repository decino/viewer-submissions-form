import { useEffect } from "react";

const SITE_NAME = "Viewer Submissions";

export function usePageTitle(title?: string) {
    useEffect(() => {
        document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - decino.nl`;
    }, [title]);
}
