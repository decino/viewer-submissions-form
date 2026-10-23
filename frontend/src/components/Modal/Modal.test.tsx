import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Button } from "../Button/Button";
import { Modal } from "./Modal";

const closeLabel = "Close";

describe("Modal", () => {
    it("renders nothing at all while it is closed", () => {
        // given
        const isOpen = false;

        // when
        const { container } = renderWithProviders(
            <Modal isOpen={isOpen} onClose={vi.fn()} title="Create round">
                <p>hidden body</p>
            </Modal>,
        );

        // then
        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByText("Create round")).not.toBeInTheDocument();
    });

    it("shows its title and its children once it is open", () => {
        // given
        const isOpen = true;

        // when
        renderWithProviders(
            <Modal isOpen={isOpen} onClose={vi.fn()} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // then
        expect(screen.getByRole("heading", { name: "Create round" })).toBeInTheDocument();
        expect(screen.getByText("name the next round")).toBeInTheDocument();
    });

    it("closes when the close control is pressed", async () => {
        // given
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        await user.click(screen.getByRole("button", { name: closeLabel }));

        // then
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes when the backdrop behind it is clicked", async () => {
        // given
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        await user.click(screen.getByRole("dialog").parentElement as HTMLElement);

        // then
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("stays open when the panel itself is clicked", async () => {
        // given
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        await user.click(screen.getByText("name the next round"));

        // then
        expect(onClose).not.toHaveBeenCalled();
    });

    it("hides its whole subtree again when it is closed after being open", () => {
        // given
        const onClose = vi.fn();
        const { rerender } = renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        rerender(
            <Modal isOpen={false} onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // then
        expect(screen.queryByText("name the next round")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: closeLabel })).not.toBeInTheDocument();
    });

    it("puts the close control in the tab order ahead of its own content", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(
            <Modal isOpen onClose={vi.fn()} title="Create round">
                <Button type="button">Save round</Button>
            </Modal>,
        );

        // when
        await user.tab();

        // then
        expect(screen.getByRole("button", { name: closeLabel })).toHaveFocus();
    });

    it("announces itself as a modal dialog named after its title", () => {
        // given
        const title = "Create round";

        // when
        renderWithProviders(
            <Modal isOpen onClose={vi.fn()} title={title}>
                <p>name the next round</p>
            </Modal>,
        );

        // then
        const dialog = screen.getByRole("dialog", { name: title });
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toContainElement(screen.getByRole("heading", { name: title }));
    });

    it("moves focus into the dialog when it opens", () => {
        // given
        const onClose = vi.fn();
        const { rerender } = renderWithProviders(
            <>
                <Button type="button">New round</Button>
                <Modal isOpen={false} onClose={onClose} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </>,
        );
        screen.getByRole("button", { name: "New round" }).focus();

        // when
        rerender(
            <>
                <Button type="button">New round</Button>
                <Modal isOpen onClose={onClose} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </>,
        );

        // then
        expect(screen.getByRole("dialog")).toHaveFocus();
    });

    it("gives focus back to whatever held it once it closes", () => {
        // given
        const onClose = vi.fn();
        const { rerender } = renderWithProviders(
            <>
                <Button type="button">New round</Button>
                <Modal isOpen={false} onClose={onClose} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </>,
        );
        const trigger = screen.getByRole("button", { name: "New round" });
        trigger.focus();
        rerender(
            <>
                <Button type="button">New round</Button>
                <Modal isOpen onClose={onClose} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </>,
        );
        screen.getByRole("button", { name: closeLabel }).focus();

        // when
        rerender(
            <>
                <Button type="button">New round</Button>
                <Modal isOpen={false} onClose={onClose} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </>,
        );

        // then
        expect(trigger).toHaveFocus();
    });

    it("closes when the escape key is pressed", async () => {
        // given
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        await user.keyboard("{Escape}");

        // then
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("stops listening for escape once it has closed", () => {
        // given
        const onClose = vi.fn();
        const { rerender } = renderWithProviders(
            <Modal isOpen onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );

        // when
        rerender(
            <Modal isOpen={false} onClose={onClose} title="Create round">
                <p>name the next round</p>
            </Modal>,
        );
        fireEvent.keyDown(document, { key: "Escape" });

        // then
        expect(onClose).not.toHaveBeenCalled();
    });

    it("does not submit a form it is rendered inside when the close control is pressed", async () => {
        // given
        const onSubmit = vi.fn((e: SubmitEvent<HTMLFormElement>) => e.preventDefault());
        const user = userEvent.setup();
        renderWithProviders(
            <form onSubmit={onSubmit}>
                <Modal isOpen onClose={vi.fn()} title="Create round">
                    <p>name the next round</p>
                </Modal>
            </form>,
        );

        // when
        await user.click(screen.getByRole("button", { name: closeLabel }));

        // then
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
