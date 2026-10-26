import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Choice } from "./Choice";

describe("Choice", () => {
    it("is a checkbox labelled with its text", () => {
        // when
        renderWithProviders(<Choice label="Is zip" checked={false} onChange={() => {}} />);

        // then
        expect(screen.getByRole("checkbox", { name: "Is zip" })).not.toBeChecked();
    });

    it("tells its owner the new checked state", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<Choice label="Is zip" checked={false} onChange={onChange} />);

        // when
        await user.click(screen.getByRole("checkbox", { name: "Is zip" }));

        // then
        expect(onChange).toHaveBeenCalledWith(true);
    });
});
