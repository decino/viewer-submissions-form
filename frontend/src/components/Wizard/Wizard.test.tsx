import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Wizard } from "./Wizard";

const steps = ["Pause round", "Select winners", "Review"] as const;

describe("Wizard", () => {
    it("marks the step the admin is on", () => {
        // when
        renderWithProviders(
            <Wizard steps={steps} current={1} onBack={() => {}} onNext={() => {}} nextLabel="Next">
                body
            </Wizard>,
        );

        // then
        expect(screen.getByText("Select winners").closest("li")).toHaveAttribute("aria-current", "step");
        expect(screen.getByText("body")).toBeInTheDocument();
    });

    it("cannot go back from the first step", () => {
        // when
        renderWithProviders(
            <Wizard steps={steps} current={0} onBack={() => {}} onNext={() => {}} nextLabel="Next">
                body
            </Wizard>,
        );

        // then
        expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    });

    it("hands back and next presses to its owner", async () => {
        // given
        const onBack = vi.fn();
        const onNext = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Wizard steps={steps} current={1} onBack={onBack} onNext={onNext} nextLabel="Finish">
                body
            </Wizard>,
        );

        // when
        await user.click(screen.getByRole("button", { name: "Back" }));
        await user.click(screen.getByRole("button", { name: "Finish" }));

        // then
        expect(onBack).toHaveBeenCalledOnce();
        expect(onNext).toHaveBeenCalledOnce();
    });

    it("blocks moving on while the owner says the step is not ready", () => {
        // when
        renderWithProviders(
            <Wizard steps={steps} current={1} onBack={() => {}} onNext={() => {}} nextLabel="Next" nextDisabled>
                body
            </Wizard>,
        );

        // then
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });
});
