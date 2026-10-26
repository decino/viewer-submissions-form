import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ToggleSwitch } from "./ToggleSwitch";

describe("ToggleSwitch", () => {
    it("exposes itself as a switch named after its label", () => {
        // given
        const label = "Show all submissions";

        // when
        renderWithProviders(<ToggleSwitch enabled={false} onChange={vi.fn()} label={label} />);

        // then
        expect(screen.getByRole("switch", { name: label })).toBeInTheDocument();
    });

    it("reports that it is off when it is not enabled", () => {
        // given
        const enabled = false;

        // when
        renderWithProviders(<ToggleSwitch enabled={enabled} onChange={vi.fn()} label="Show all submissions" />);

        // then
        expect(screen.getByRole("switch", { name: "Show all submissions" })).toHaveAttribute("aria-checked", "false");
    });

    it("reports that it is on when it is enabled", () => {
        // given
        const enabled = true;

        // when
        renderWithProviders(<ToggleSwitch enabled={enabled} onChange={vi.fn()} label="Show all submissions" />);

        // then
        expect(screen.getByRole("switch", { name: "Show all submissions" })).toHaveAttribute("aria-checked", "true");
    });

    it("asks to be switched on when it is clicked while off", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<ToggleSwitch enabled={false} onChange={onChange} label="Show all submissions" />);

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it("asks to be switched off when it is clicked while on", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<ToggleSwitch enabled onChange={onChange} label="Show all submissions" />);

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it("can be operated from the keyboard", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<ToggleSwitch enabled={false} onChange={onChange} label="Show all submissions" />);

        // when
        await user.tab();
        await user.keyboard("{Enter}");
        await user.keyboard(" ");

        // then
        expect(screen.getByRole("switch", { name: "Show all submissions" })).toHaveFocus();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(2, true);
    });

    it.each([
        [true, "On"],
        [false, "Off"],
    ])("writes its state next to the label when enabled is %s", (enabled, state) => {
        // when
        renderWithProviders(<ToggleSwitch enabled={enabled} onChange={vi.fn()} label="Jump" />);

        // then
        expect(screen.getByRole("switch", { name: "Jump" })).toHaveTextContent(`Jump${state}`);
    });

    it("does not submit a surrounding form when it is toggled", async () => {
        // given
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <form onSubmit={onSubmit}>
                <ToggleSwitch enabled={false} onChange={vi.fn()} label="Show all submissions" />
            </form>,
        );

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
