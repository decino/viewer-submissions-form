import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Hud, HudCell } from "./Hud";

describe("Hud", () => {
    it("pairs every label with its value as a description list", () => {
        // when
        renderWithProviders(
            <Hud aria-label="Round status">
                <HudCell label="Entries" value={137} />
                <HudCell label="Status" value="Open" tone="green" size="small" />
            </Hud>,
        );

        // then
        const terms = screen.getAllByRole("term").map(term => term.textContent);
        const definitions = screen.getAllByRole("definition").map(definition => definition.textContent);
        expect(terms).toEqual(["Entries", "Status"]);
        expect(definitions).toEqual(["137", "Open"]);
        expect(screen.getByLabelText("Round status")).toBeInTheDocument();
    });

    it("lays a wide cell out differently from a normal one", () => {
        // when
        renderWithProviders(
            <Hud>
                <HudCell label="Round" value="October round" wide />
                <HudCell label="Entries" value={37} />
            </Hud>,
        );

        // then
        const [wide, normal] = screen.getAllByRole("term").map(term => term.parentElement?.className);
        expect(wide).not.toBe(normal);
    });

    it("styles each tone differently", () => {
        // when
        renderWithProviders(
            <Hud>
                <HudCell label="red" value="r" tone="red" />
                <HudCell label="gold" value="g" tone="gold" />
                <HudCell label="green" value="n" tone="green" />
            </Hud>,
        );

        // then
        const classes = new Set(screen.getAllByRole("definition").map(definition => definition.className));
        expect(classes.size).toBe(3);
    });
});
