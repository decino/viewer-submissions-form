import type { KeyboardEvent, TextareaHTMLAttributes } from "react";
import styles from "./TextArea.module.css";

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

function isSubmitShortcut(e: KeyboardEvent<HTMLTextAreaElement>): boolean {
    return e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing;
}

function isSubmitButton(element: Element): element is HTMLButtonElement | HTMLInputElement {
    if (element instanceof HTMLButtonElement) {
        return element.type === "submit";
    }

    return element instanceof HTMLInputElement && (element.type === "submit" || element.type === "image");
}

function submitFormLikeEnter(form: HTMLFormElement) {
    const defaultButton = Array.from(form.elements).find(isSubmitButton);

    if (!defaultButton) {
        form.requestSubmit();
        return;
    }

    if (defaultButton.disabled) {
        return;
    }

    form.requestSubmit(defaultButton);
}

export function TextArea({ onKeyDown, ...rest }: TextAreaProps) {
    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        onKeyDown?.(e);

        if (e.defaultPrevented || !isSubmitShortcut(e)) {
            return;
        }

        const form = e.currentTarget.form;
        if (form) {
            e.preventDefault();
            submitFormLikeEnter(form);
        }
    }

    return <textarea dir="auto" className={styles.textarea} onKeyDown={handleKeyDown} {...rest} />;
}
