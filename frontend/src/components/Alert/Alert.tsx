import type { ComponentPropsWithoutRef } from "react";
import styles from "./Alert.module.scss";

type AlertType = "danger" | "success" | "warning" | "info" | "light";

interface AlertProps extends ComponentPropsWithoutRef<"div"> {
    type: AlertType;
    icon?: string;
    hidden?: boolean;
}

const iconMap: Record<AlertType, string> = {
    danger: "bi-exclamation-triangle-fill",
    success: "bi-check-circle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill",
    light: "bi-info-circle",
};

export default function Alert({ type, children, icon, className, hidden = false, ...props }: AlertProps) {
    const iconClass = icon || iconMap[type];

    const classes = [styles.alert, styles[type], hidden && styles.hidden, className].filter(Boolean).join(" ");

    return (
        <div className={classes} role="alert" {...props}>
            {iconClass && <i className={`${styles.icon} bi ${iconClass}`}></i>}
            <div className={styles.content}>{children}</div>
        </div>
    );
}
