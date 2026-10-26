import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { RoundTabs } from "./RoundTabs";

const rounds = [
    { id: 9, name: "Round 9", created: "2026-09-01T12:00:00.000Z" },
    { id: 7, name: "Round 7", created: "2026-07-01T09:30:00.000Z" },
];

function renderTabs() {
    return renderWithProviders(
        <RoundTabs rounds={rounds} idPrefix="results" ariaLabel="Previous rounds">
            {(round, showAll) => <p>{`${round.name} ${showAll ? "with every submission" : "results only"}`}</p>}
        </RoundTabs>,
    );
}

describe("RoundTabs", () => {
    it("lists the rounds oldest first and opens on the newest", () => {
        // when
        renderTabs();

        // then
        expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Round 7", "Round 9"]);
        expect(screen.getByRole("tab", { name: "Round 9" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Round 9 results only")).toBeInTheDocument();
        expect(screen.getByText("Started on 1st of September 2026 at 12:00 UTC")).toBeInTheDocument();
    });

    it("shows the round whose tab is picked", async () => {
        // given
        const user = userEvent.setup();
        renderTabs();

        // when
        await user.click(screen.getByRole("tab", { name: "Round 7" }));

        // then
        expect(screen.getByText("Round 7 results only")).toBeInTheDocument();
        expect(screen.getByText("Started on 1st of July 2026 at 09:30 UTC")).toBeInTheDocument();
    });

    it("tells its content to show every submission once the switch is on", async () => {
        // given
        const user = userEvent.setup();
        renderTabs();

        // when
        await user.click(screen.getByRole("switch", { name: "Show all submissions" }));

        // then
        expect(screen.getByText("Round 9 with every submission")).toBeInTheDocument();
    });

    it("renders nothing when there are no rounds", () => {
        // when
        renderWithProviders(
            <RoundTabs rounds={[]} idPrefix="results" ariaLabel="Previous rounds">
                {() => <p>content</p>}
            </RoundTabs>,
        );

        // then
        expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });
});
