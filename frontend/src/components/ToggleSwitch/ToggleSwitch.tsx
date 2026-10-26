import { Button } from "../Button/Button";
import styles from "./ToggleSwitch.module.css";

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label: string;
}

export function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
    return (
        <Button
            type="button"
            className={styles.row}
            onClick={() => onChange(!enabled)}
            role="switch"
            aria-checked={enabled}
            aria-label={label}
        >
            <span className={styles.label}>{label}</span>
            <span className={enabled ? styles.on : styles.off} aria-hidden="true">
                {enabled ? "On" : "Off"}
            </span>
        </Button>
    );
}
