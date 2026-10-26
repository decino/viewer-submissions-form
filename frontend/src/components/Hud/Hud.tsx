import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Hud.module.css";

export function Hud({ className, children, ...rest }: HTMLAttributes<HTMLDListElement>) {
    const classes = [styles.hud, className].filter(Boolean).join(" ");

    return (
        <dl className={classes} {...rest}>
            {children}
        </dl>
    );
}

interface HudCellProps {
    label: string;
    value: ReactNode;
    tone?: "red" | "gold" | "green";
    size?: "large" | "small";
    wide?: boolean;
}

export function HudCell({ label, value, tone = "red", size = "large", wide = false }: HudCellProps) {
    const valueClasses = [styles.value, styles[tone], styles[size]].join(" ");

    return (
        <div className={wide ? styles.wideCell : styles.cell}>
            <dt className={styles.label}>{label}</dt>
            <dd className={valueClasses}>{value}</dd>
        </div>
    );
}
