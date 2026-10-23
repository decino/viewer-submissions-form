import styles from "./ChoiceGroup.module.css";

interface ChoiceOption<T> {
    value: T;
    label: string;
}

interface ChoiceGroupProps<T> {
    legend: string;
    name: string;
    choices: readonly ChoiceOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

export function ChoiceGroup<T>({ legend, name, choices, value, onChange }: ChoiceGroupProps<T>) {
    return (
        <fieldset className={styles.group}>
            <legend className={styles.legend}>{legend}</legend>
            <div className={styles.segments}>
                {choices.map(choice => {
                    const checked = choice.value === value;

                    return (
                        <label key={choice.label} className={checked ? styles.picked : styles.segment}>
                            <input
                                type="radio"
                                className={styles.input}
                                name={name}
                                checked={checked}
                                onChange={() => onChange(choice.value)}
                            />
                            {choice.label}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
