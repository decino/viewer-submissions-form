import { type PropsWithChildren, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import styles from "./Modal.module.css";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export function Modal({ isOpen, onClose, title, children }: PropsWithChildren<ModalProps>) {
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previous = document.activeElement as HTMLElement | null;
        panelRef.current?.focus();

        return () => {
            previous?.focus();
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={panelRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 id={titleId} className={styles.title} dir="auto">
                        {title}
                    </h2>
                    <Button type="button" size="small" className={styles.close} aria-label="Close" onClick={onClose}>
                        <span aria-hidden="true">{"✕"}</span>
                    </Button>
                </div>
                <div className={styles.body}>{children}</div>
            </div>
        </div>,
        document.body,
    );
}
