import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Button } from "../Button/Button";
import { Panel } from "./Panel";

describe("Panel", () => {
    it("labels the region with its title as a heading", () => {
        // when
        renderWithProviders(<Panel title="Current submissions">list</Panel>);

        // then
        expect(screen.getByRole("heading", { name: "Current submissions" })).toBeInTheDocument();
        expect(screen.getByText("list")).toBeInTheDocument();
    });

    it("renders the actions next to the title", () => {
        // when
        renderWithProviders(
            <Panel title="Round" actions={<Button type="button">Pause</Button>}>
                body
            </Panel>,
        );

        // then
        expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });

    it("leaves out the header when it has neither title nor actions", () => {
        // when
        renderWithProviders(<Panel>just the body</Panel>);

        // then
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        expect(screen.getByText("just the body")).toBeInTheDocument();
    });

    it("forwards native attributes such as an aria label", () => {
        // when
        renderWithProviders(<Panel aria-label="Round status">body</Panel>);

        // then
        expect(screen.getByLabelText("Round status")).toBeInTheDocument();
    });
});
