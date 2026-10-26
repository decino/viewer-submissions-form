import type { ReactNode } from "react";
import styles from "./RoundTitle.module.css";

interface RoundTitleProps {
    children: ReactNode;
}

export function RoundTitle({ children }: RoundTitleProps) {
    return <h1 className={styles.title}>{children}</h1>;
}
