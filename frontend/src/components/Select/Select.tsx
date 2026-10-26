import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">;

export function Select({ children, ...rest }: SelectProps) {
    return (
        <select className={styles.select} {...rest}>
            {children}
        </select>
    );
}
