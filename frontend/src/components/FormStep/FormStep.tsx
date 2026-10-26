import type { ReactNode } from "react";
import styles from "./FormStep.module.css";

interface FormStepProps {
    number: number;
    title: string;
    children: ReactNode;
}

export function FormStep({ number, title, children }: FormStepProps) {
    return (
        <fieldset className={styles.step}>
            <legend className={styles.legend}>
                <span className={styles.number} aria-hidden="true">
                    {number}
                </span>
                {title}
            </legend>
            <div className={styles.fields}>{children}</div>
        </fieldset>
    );
}
