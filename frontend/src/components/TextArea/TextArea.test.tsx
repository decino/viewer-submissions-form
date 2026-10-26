import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Button } from "../Button/Button";
import { TextArea } from "./TextArea";

describe("TextArea", () => {
    it("is reachable through the label that points at it", () => {
        // given
        const markup = (
            <>
                <label htmlFor="info">Tell me something about the level</label>
                <TextArea id="info" />
            </>
        );

        // when
        renderWithProviders(markup);

        // then
        expect(screen.getByLabelText("Tell me something about the level")).toBeInstanceOf(HTMLTextAreaElement);
    });

    it("collects the text that is typed into it", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<TextArea placeholder="Say something" onChange={onChange} />);

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "rip and tear");

        // then
        expect(screen.getByPlaceholderText("Say something")).toHaveValue("rip and tear");
        expect(onChange).toHaveBeenCalledTimes("rip and tear".length);
    });

    it("keeps newlines that are typed into it", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<TextArea placeholder="Say something" />);

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "slaughter map{enter}hard as nails");

        // then
        expect(screen.getByPlaceholderText("Say something")).toHaveValue("slaughter map\nhard as nails");
    });

    it("shows the value it is controlled with", () => {
        // given
        const onChange = vi.fn();

        // when
        renderWithProviders(<TextArea placeholder="Say something" value="the icon of sin" onChange={onChange} />);

        // then
        expect(screen.getByPlaceholderText("Say something")).toHaveValue("the icon of sin");
    });

    it("refuses input while it is disabled", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<TextArea placeholder="Say something" disabled onChange={onChange} />);

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "doom");

        // then
        expect(screen.getByPlaceholderText("Say something")).toBeDisabled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("forwards native attributes to the underlying textarea", () => {
        // given
        const markup = <TextArea placeholder="Say something" rows={7} maxLength={300} required name="info" />;

        // when
        renderWithProviders(markup);

        // then
        const textarea = screen.getByPlaceholderText("Say something");
        expect(textarea).toHaveAttribute("rows", "7");
        expect(textarea).toHaveAttribute("maxlength", "300");
        expect(textarea).toHaveAttribute("name", "info");
        expect(textarea).toBeRequired();
    });

    it("stops accepting text once the maximum length is reached", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<TextArea placeholder="Say something" maxLength={4} />);

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "cyberdemon");

        // then
        expect(screen.getByPlaceholderText("Say something")).toHaveValue("cybe");
    });

    it("submits the form it sits in on cmd and enter", async () => {
        // given
        const onSubmit = vi.fn((e: SubmitEvent<HTMLFormElement>) => e.preventDefault());
        const user = userEvent.setup();
        renderWithProviders(
            <form onSubmit={onSubmit}>
                <TextArea placeholder="Say something" />
                <Button type="submit">Submit WAD</Button>
            </form>,
        );

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "{Meta>}{Enter}{/Meta}");

        // then
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("submits the form it sits in on ctrl and enter", async () => {
        // given
        const onSubmit = vi.fn((e: SubmitEvent<HTMLFormElement>) => e.preventDefault());
        const user = userEvent.setup();
        renderWithProviders(
            <form onSubmit={onSubmit}>
                <TextArea placeholder="Say something" />
                <Button type="submit">Submit WAD</Button>
            </form>,
        );

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "{Control>}{Enter}{/Control}");

        // then
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("leaves the form alone while its submit button is disabled", async () => {
        // given
        const onSubmit = vi.fn((e: SubmitEvent<HTMLFormElement>) => e.preventDefault());
        const user = userEvent.setup();
        renderWithProviders(
            <form onSubmit={onSubmit}>
                <TextArea placeholder="Say something" />
                <Button type="submit" disabled>
                    Submit WAD
                </Button>
            </form>,
        );

        // when
        await user.type(screen.getByPlaceholderText("Say something"), "{Control>}{Enter}{/Control}");

        // then
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
