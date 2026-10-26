import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps {
    message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
    if (message === null) {
        return null;
    }

    return (
        <div className={styles.banner} role="alert">
            {message}
        </div>
    );
}
