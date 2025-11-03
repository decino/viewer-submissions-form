import type { ComponentPropsWithoutRef } from "react";
import styles from "./Card.module.scss";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
    borderPrimary?: boolean;
}

export default function Card({ children, className, borderPrimary = false, ...props }: CardProps) {
    const classes = [styles.card, borderPrimary && styles.borderPrimary, className].filter(Boolean).join(" ");

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
    return (
        <div className={`${styles.cardHeader} ${className || ""}`} {...props}>
            {children}
        </div>
    );
}

export function CardBody({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
    return (
        <div className={`${styles.cardBody} ${className || ""}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
    return (
        <div className={`${styles.cardFooter} ${className || ""}`} {...props}>
            {children}
        </div>
    );
}
