import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { Button } from "../Button/Button";
import styles from "./TabStrip.module.css";
import { tabId, tabPanelId } from "./tabIds";

interface TabDefinition<T extends string> {
    id: T;
    label: ReactNode;
}

interface TabStripProps<T extends string> {
    tabs: TabDefinition<T>[];
    active: T;
    onSelect: (id: T) => void;
    idPrefix: string;
    ariaLabel: string;
    className?: string;
}

export function TabStrip<T extends string>({
    tabs,
    active,
    onSelect,
    idPrefix,
    ariaLabel,
    className,
}: TabStripProps<T>) {
    const stripRef = useRef<HTMLDivElement>(null);

    function focusTab(index: number) {
        const buttons = stripRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[index]?.focus();
    }

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        const current = tabs.findIndex(t => t.id === active);
        if (current < 0) {
            return;
        }

        let next = -1;
        if (e.key === "ArrowRight") {
            next = (current + 1) % tabs.length;
        }
        if (e.key === "ArrowLeft") {
            next = (current - 1 + tabs.length) % tabs.length;
        }
        if (e.key === "Home") {
            next = 0;
        }
        if (e.key === "End") {
            next = tabs.length - 1;
        }

        if (next < 0) {
            return;
        }

        e.preventDefault();
        onSelect(tabs[next].id);
        focusTab(next);
    }

    return (
        <div
            ref={stripRef}
            role="tablist"
            aria-label={ariaLabel}
            className={[styles.strip, className].filter(Boolean).join(" ")}
            onKeyDown={handleKeyDown}
        >
            {tabs.map(tab => {
                const selected = tab.id === active;
                const tabClasses = selected ? `${styles.tab} ${styles.active}` : styles.tab;

                return (
                    <Button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={tabId(idPrefix, tab.id)}
                        aria-selected={selected}
                        aria-controls={tabPanelId(idPrefix, tab.id)}
                        tabIndex={selected ? 0 : -1}
                        className={tabClasses}
                        onClick={() => onSelect(tab.id)}
                    >
                        {tab.label}
                    </Button>
                );
            })}
        </div>
    );
}
