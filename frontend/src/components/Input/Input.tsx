import type { ComponentProps } from "react";
import styles from "./Input.module.css";

interface InputProps extends ComponentProps<"input"> {
    fullWidth?: boolean;
}

export function Input({ fullWidth, className, ...rest }: InputProps) {
    const classes = [styles.input, fullWidth ? styles.fullWidth : "", className].filter(Boolean).join(" ");

    return <input dir="auto" className={classes} {...rest} />;
}
