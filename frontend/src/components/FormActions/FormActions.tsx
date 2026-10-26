import type { ReactNode } from "react";
import styles from "./FormActions.module.css";

interface FormActionsProps {
    children: ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
    return <div className={styles.actions}>{children}</div>;
}
