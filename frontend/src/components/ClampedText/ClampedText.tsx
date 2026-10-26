import styles from "./ClampedText.module.css";

interface ClampedTextProps {
    text: string | null;
}

export function ClampedText({ text }: ClampedTextProps) {
    return <span className={styles.text}>{text ?? ""}</span>;
}
