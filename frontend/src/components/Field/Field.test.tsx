import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Field } from "./Field";

describe("Field", () => {
    it("labels the control it wraps", () => {
        // when
        renderWithProviders(
            <Field label="WAD name" htmlFor="wad-name">
                <input id="wad-name" />
            </Field>,
        );

        // then
        expect(screen.getByLabelText("WAD name")).toBeInTheDocument();
    });

    it("shows a hint beneath the control when one is given", () => {
        // when
        renderWithProviders(
            <Field label="WAD file" htmlFor="wad-file" hint="Uploads are limited to 512 MB">
                <input id="wad-file" type="file" />
            </Field>,
        );

        // then
        expect(screen.getByText("Uploads are limited to 512 MB")).toBeInTheDocument();
    });
});
