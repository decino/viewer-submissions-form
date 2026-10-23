import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Button } from "../Button/Button";
import { FormActions } from "./FormActions";

describe("FormActions", () => {
    it("renders the form's buttons", () => {
        // when
        renderWithProviders(
            <FormActions>
                <Button type="button">Cancel</Button>
                <Button type="submit">Save changes</Button>
            </FormActions>,
        );

        // then
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    });
});
