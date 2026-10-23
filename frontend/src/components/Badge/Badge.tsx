import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: "danger" | "info" | "success" | "warning" | "muted";
}

export function Badge({ tone = "muted", className, children, ...rest }: BadgeProps) {
    const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");

    return (
        <span className={classes} {...rest}>
            {children}
        </span>
    );
}
