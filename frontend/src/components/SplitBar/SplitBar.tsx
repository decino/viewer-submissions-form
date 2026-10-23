import styles from "./SplitBar.module.css";

interface SplitBarSlice {
    label: string;
    value: number;
    tone: "red" | "gold" | "green" | "blue" | "steel";
}

interface SplitBarProps {
    title: string;
    slices: readonly SplitBarSlice[];
    emptyMessage: string;
}

function percentOf(value: number, total: number): number {
    return Math.round((value / total) * 1000) / 10;
}

export function SplitBar({ title, slices, emptyMessage }: SplitBarProps) {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);

    return (
        <figure className={styles.split}>
            <figcaption className={styles.title}>{title}</figcaption>
            {total === 0 ? (
                <p className={styles.empty}>{emptyMessage}</p>
            ) : (
                <>
                    <div className={styles.bar} aria-hidden="true">
                        {slices.map(slice => (
                            <span
                                key={slice.label}
                                className={[styles.segment, styles[slice.tone]].join(" ")}
                                style={{ flexGrow: slice.value }}
                            />
                        ))}
                    </div>
                    <ul className={styles.legend}>
                        {slices.map(slice => (
                            <li key={slice.label} className={styles.legendItem}>
                                <span className={[styles.swatch, styles[slice.tone]].join(" ")} aria-hidden="true" />
                                <span className={styles.legendLabel}>{slice.label}</span>
                                <span className={styles.legendValue}>
                                    {slice.value} ({percentOf(slice.value, total)}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </figure>
    );
}
