import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { TabStrip } from "./TabStrip";
import { tabId, tabPanelId } from "./tabIds";

const TABS = [
    { id: "1" as const, label: "Round 1" },
    { id: "2" as const, label: "Round 2" },
    { id: "3" as const, label: "Round 3" },
];

function renderStrip(active: (typeof TABS)[number]["id"] = "1") {
    const onSelect = vi.fn();
    renderWithProviders(
        <TabStrip tabs={TABS} active={active} onSelect={onSelect} idPrefix="results" ariaLabel="Previous rounds" />,
    );

    return { onSelect };
}

describe("TabStrip", () => {
    it("labels the tab list it renders", () => {
        // when
        renderStrip();

        // then
        expect(screen.getByRole("tablist", { name: "Previous rounds" })).toBeInTheDocument();
    });

    it("marks only the active tab as selected and keeps it the only stop in the tab order", () => {
        // given
        renderStrip("2");

        // when
        const tabs = screen.getAllByRole("tab");

        // then
        expect(tabs.map(t => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
        expect(tabs.map(t => t.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
    });

    it("points each tab at the panel it controls", () => {
        // given
        renderStrip();

        // when
        const tab = screen.getByRole("tab", { name: "Round 1" });

        // then
        expect(tab).toHaveAttribute("id", tabId("results", "1"));
        expect(tab).toHaveAttribute("aria-controls", tabPanelId("results", "1"));
    });

    it("selects the tab that is clicked", async () => {
        // given
        const user = userEvent.setup();
        const { onSelect } = renderStrip("1");

        // when
        await user.click(screen.getByRole("tab", { name: "Round 3" }));

        // then
        expect(onSelect).toHaveBeenCalledWith("3");
    });

    it("moves right with the arrow key and wraps at the end", async () => {
        // given
        const user = userEvent.setup();
        const { onSelect } = renderStrip("3");
        await user.click(screen.getByRole("tab", { name: "Round 3" }));
        onSelect.mockClear();

        // when
        await user.keyboard("{ArrowRight}");

        // then
        expect(onSelect).toHaveBeenCalledWith("1");
    });

    it("moves left with the arrow key and wraps at the start", async () => {
        // given
        const user = userEvent.setup();
        const { onSelect } = renderStrip("1");
        await user.click(screen.getByRole("tab", { name: "Round 1" }));
        onSelect.mockClear();

        // when
        await user.keyboard("{ArrowLeft}");

        // then
        expect(onSelect).toHaveBeenCalledWith("3");
    });

    it("jumps to the first and last tabs with Home and End", async () => {
        // given
        const user = userEvent.setup();
        const { onSelect } = renderStrip("2");
        await user.click(screen.getByRole("tab", { name: "Round 2" }));
        onSelect.mockClear();

        // when
        await user.keyboard("{End}");
        await user.keyboard("{Home}");

        // then
        expect(onSelect).toHaveBeenNthCalledWith(1, "3");
        expect(onSelect).toHaveBeenNthCalledWith(2, "1");
    });

    it("styles the active tab differently from the others", () => {
        // given
        renderStrip("2");

        // when
        const tabs = screen.getAllByRole("tab");

        // then
        expect(tabs[1].className).not.toBe(tabs[0].className);
        expect(tabs[0].className).toBe(tabs[2].className);
    });
});
