import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ChoiceGroup } from "./ChoiceGroup";

const choices = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
] as const;

describe("ChoiceGroup", () => {
    it("names the group and checks the current value", () => {
        // when
        renderWithProviders(
            <ChoiceGroup
                legend="Did you make this level?"
                name="author"
                choices={choices}
                value={false}
                onChange={() => {}}
            />,
        );

        // then
        expect(screen.getByRole("group", { name: "Did you make this level?" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "Yes" })).not.toBeChecked();
    });

    it("hands the picked value to its owner", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <ChoiceGroup
                legend="Did you make this level?"
                name="author"
                choices={choices}
                value={false}
                onChange={onChange}
            />,
        );

        // when
        await user.click(screen.getByRole("radio", { name: "Yes" }));

        // then
        expect(onChange).toHaveBeenCalledWith(true);
    });
});
