import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Panel.module.css";

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    title?: ReactNode;
    actions?: ReactNode;
}

export function Panel({ title, actions, className, children, ...rest }: PanelProps) {
    const classes = [styles.panel, className].filter(Boolean).join(" ");

    return (
        <section className={classes} {...rest}>
            {(title || actions) && (
                <header className={styles.header}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {actions && <div className={styles.actions}>{actions}</div>}
                </header>
            )}
            <div className={styles.body}>{children}</div>
        </section>
    );
}
