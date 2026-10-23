import type { ReactNode } from "react";
import styles from "./SuccessMessage.module.css";

interface SuccessMessageProps {
    children: ReactNode;
}

export function SuccessMessage({ children }: SuccessMessageProps) {
    return (
        <p role="status" className={styles.success}>
            {children}
        </p>
    );
}
