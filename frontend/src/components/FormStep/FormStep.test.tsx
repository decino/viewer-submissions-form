import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { FormStep } from "./FormStep";

describe("FormStep", () => {
    it("names the group after its title, leaving the step number out", () => {
        // when
        renderWithProviders(
            <FormStep number={2} title="How I should play it">
                <input aria-label="Notes" />
            </FormStep>,
        );

        // then
        const step = screen.getByRole("group", { name: "How I should play it" });
        expect(step).toContainElement(screen.getByRole("textbox", { name: "Notes" }));
        expect(step).toHaveTextContent("2");
    });
});
