import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import styles from "./Wizard.module.css";

interface WizardProps {
    steps: readonly string[];
    current: number;
    onBack: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
    children: ReactNode;
}

export function Wizard({ steps, current, onBack, onNext, nextLabel, nextDisabled = false, children }: WizardProps) {
    return (
        <div className={styles.wizard}>
            <ol className={styles.steps}>
                {steps.map((step, index) => {
                    const classes = [
                        styles.step,
                        index === current ? styles.current : undefined,
                        index < current ? styles.done : undefined,
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <li key={step} className={classes} aria-current={index === current ? "step" : undefined}>
                            <span className={styles.number}>{index + 1}</span>
                            {step}
                        </li>
                    );
                })}
            </ol>

            <div className={styles.body}>{children}</div>

            <div className={styles.footer}>
                <Button type="button" onClick={onBack} disabled={current === 0}>
                    Back
                </Button>
                <Button type="button" variant="primary" onClick={onNext} disabled={nextDisabled}>
                    {nextLabel}
                </Button>
            </div>
        </div>
    );
}
