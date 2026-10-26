import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { readStored, writeStored } from "../../utils/storage";
import { Button } from "../Button/Button";
import { ToggleSwitch } from "../ToggleSwitch/ToggleSwitch";
import styles from "./DataTable.module.css";

type RowModifiers = {
    additive: boolean;
    range: boolean;
};

const INTERACTIVE = "a, button, input, select, textarea, label";

export interface DataTableColumn<T> {
    key: string;
    header: string;
    render: (row: T, index: number) => ReactNode;
    hidden?: boolean;
}

interface DataTableProps<T> {
    label: string;
    rows: readonly T[];
    columns: readonly DataTableColumn<T>[];
    rowKey: (row: T) => number;
    emptyMessage: string;
    selection?: "none" | "single" | "multi";
    selectedKeys?: ReadonlySet<number>;
    onSelectionChange?: (keys: Set<number>) => void;
    toolbar?: ReactNode;
    rowTone?: (row: T) => "danger" | undefined;
}

function initialHidden<T>(label: string, columns: readonly DataTableColumn<T>[]): Set<string> {
    const stored = readStored<string[]>("local", hiddenColumnsKey(label));

    return new Set(stored ?? columns.filter(column => column.hidden).map(column => column.key));
}

function hiddenColumnsKey(label: string): string {
    return `hidden-columns:${label}`;
}

export function DataTable<T>({
    label,
    rows,
    columns,
    rowKey,
    emptyMessage,
    selection = "none",
    selectedKeys = new Set<number>(),
    onSelectionChange,
    toolbar,
    rowTone,
}: DataTableProps<T>) {
    const [hidden, setHidden] = useState(() => initialHidden(label, columns));
    const [columnsOpen, setColumnsOpen] = useState(false);
    const [anchor, setAnchor] = useState<number | null>(null);
    const menuTitleId = useId();
    const pickerRef = useRef<HTMLDivElement>(null);
    const visible = columns.filter(column => !hidden.has(column.key));

    useEffect(() => {
        if (!columnsOpen) {
            return;
        }

        function onPointerDown(e: PointerEvent) {
            if (e.target instanceof Node && pickerRef.current?.contains(e.target)) {
                return;
            }

            setColumnsOpen(false);
        }

        document.addEventListener("pointerdown", onPointerDown);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [columnsOpen]);

    function toggleColumn(key: string) {
        const next = new Set(hidden);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setHidden(next);
        writeStored("local", hiddenColumnsKey(label), [...next]);
    }

    const selectable = selection !== "none" && onSelectionChange !== undefined;

    function pickRow(key: number, modifiers: RowModifiers) {
        if (!selectable) {
            return;
        }

        const keys = rows.map(rowKey);
        const anchorIndex = anchor === null ? -1 : keys.indexOf(anchor);

        if (selection === "multi" && modifiers.range && anchorIndex >= 0) {
            const clickedIndex = keys.indexOf(key);
            const [from, to] = anchorIndex < clickedIndex ? [anchorIndex, clickedIndex] : [clickedIndex, anchorIndex];
            onSelectionChange(new Set(keys.slice(from, to + 1)));
            return;
        }

        setAnchor(key);

        if (selection === "multi" && modifiers.additive) {
            const next = new Set(selectedKeys);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            onSelectionChange(next);
            return;
        }

        const onlyThisOne = selectedKeys.size === 1 && selectedKeys.has(key);
        onSelectionChange(onlyThisOne ? new Set() : new Set([key]));
    }

    function clickRow(key: number, event: MouseEvent<HTMLTableRowElement>) {
        if (event.target instanceof Element && event.target.closest(INTERACTIVE)) {
            return;
        }

        pickRow(key, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey });
    }

    function pressRow(key: number, event: KeyboardEvent<HTMLTableRowElement>) {
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        event.preventDefault();
        pickRow(key, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey });
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.actions}>{toolbar}</div>
                <div ref={pickerRef} className={styles.columnPicker}>
                    <Button
                        type="button"
                        size="small"
                        aria-expanded={columnsOpen}
                        onClick={() => setColumnsOpen(open => !open)}
                    >
                        Columns
                    </Button>
                    {columnsOpen && (
                        <div className={styles.columnMenu} role="group" aria-labelledby={menuTitleId}>
                            <p id={menuTitleId} className={styles.columnLegend}>
                                Show columns
                            </p>
                            {columns.map(column => (
                                <ToggleSwitch
                                    key={column.key}
                                    label={column.header}
                                    enabled={!hidden.has(column.key)}
                                    onChange={() => toggleColumn(column.key)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.scroller}>
                <table className={styles.table} aria-label={label}>
                    <thead>
                        <tr>
                            {visible.map(column => (
                                <th key={column.key} scope="col">
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td className={styles.empty} colSpan={visible.length}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                        {rows.map((row, index) => {
                            const key = rowKey(row);
                            const selected = selectedKeys.has(key);
                            const classes = [
                                styles.row,
                                selectable ? styles.selectable : undefined,
                                selected ? styles.selected : undefined,
                                rowTone?.(row) === "danger" ? styles.danger : undefined,
                            ]
                                .filter(Boolean)
                                .join(" ");

                            return (
                                <tr
                                    key={key}
                                    className={classes}
                                    aria-selected={selectable ? selected : undefined}
                                    tabIndex={selectable ? 0 : undefined}
                                    onClick={selectable ? event => clickRow(key, event) : undefined}
                                    onKeyDown={selectable ? event => pressRow(key, event) : undefined}
                                >
                                    {visible.map(column => (
                                        <td key={column.key}>{column.render(row, index)}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
