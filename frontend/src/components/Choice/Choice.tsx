import styles from "./Choice.module.css";

interface ChoiceProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function Choice({ label, checked, onChange }: ChoiceProps) {
    return (
        <label className={styles.choice}>
            <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
            {label}
        </label>
    );
}
