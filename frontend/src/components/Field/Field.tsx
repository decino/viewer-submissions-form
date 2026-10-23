import type { ReactNode } from "react";
import styles from "./Field.module.css";

interface FieldProps {
    label: ReactNode;
    htmlFor: string;
    hint?: ReactNode;
    children: ReactNode;
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
    return (
        <div className={styles.field}>
            <label className={styles.label} htmlFor={htmlFor}>
                {label}
            </label>
            {children}
            {hint && <p className={styles.hint}>{hint}</p>}
        </div>
    );
}
