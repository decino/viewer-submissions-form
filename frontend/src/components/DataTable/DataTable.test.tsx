import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Button } from "../Button/Button";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Wad {
    id: number;
    name: string;
    level: string;
}

const wads: Wad[] = [
    { id: 1, name: "Sunlust", level: "MAP12" },
    { id: 2, name: "Alien Vendetta", level: "MAP20" },
];

const columns: DataTableColumn<Wad>[] = [
    { key: "name", header: "WAD", render: wad => wad.name },
    { key: "level", header: "Level", render: wad => wad.level, hidden: true },
];

const threeWads: Wad[] = [...wads, { id: 3, name: "Scythe", level: "MAP30" }];

function cellsOf(row: HTMLElement): string[] {
    return within(row)
        .getAllByRole("cell")
        .map(cell => cell.textContent ?? "");
}

function rowOf(name: string): HTMLElement {
    return screen.getByRole("row", { name: new RegExp(name) });
}

function renderSelectable(
    selection: "single" | "multi",
    selectedKeys: ReadonlySet<number>,
    onSelectionChange: (keys: Set<number>) => void,
) {
    return renderWithProviders(
        <DataTable
            label="WADs"
            rows={threeWads}
            columns={columns}
            rowKey={wad => wad.id}
            emptyMessage="none"
            selection={selection}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
        />,
    );
}

describe("DataTable", () => {
    it("renders a row per item with the visible columns only", () => {
        // when
        renderWithProviders(
            <DataTable label="WADs" rows={wads} columns={columns} rowKey={wad => wad.id} emptyMessage="none" />,
        );

        // then
        const rows = within(screen.getByRole("table", { name: "WADs" }))
            .getAllByRole("row")
            .slice(1);
        expect(rows.map(cellsOf)).toEqual([["Sunlust"], ["Alien Vendetta"]]);
        expect(screen.queryByRole("columnheader", { name: "Level" })).not.toBeInTheDocument();
    });

    it("shows a hidden column once it is switched on in the column picker", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(
            <DataTable label="WADs" rows={wads} columns={columns} rowKey={wad => wad.id} emptyMessage="none" />,
        );

        // when
        await user.click(screen.getByRole("button", { name: "Columns" }));
        await user.click(screen.getByRole("switch", { name: "Level" }));

        // then
        expect(screen.getByRole("columnheader", { name: "Level" })).toBeInTheDocument();
    });

    it("closes the column picker when clicking outside it", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(
            <DataTable label="WADs" rows={wads} columns={columns} rowKey={wad => wad.id} emptyMessage="none" />,
        );
        await user.click(screen.getByRole("button", { name: "Columns" }));

        // when
        await user.click(document.body);

        // then
        expect(screen.queryByRole("switch", { name: "Level" })).not.toBeInTheDocument();
    });

    it("remembers the columns picked for a table the next time it is drawn", async () => {
        // given
        const user = userEvent.setup();
        const table = (
            <DataTable label="WADs" rows={wads} columns={columns} rowKey={wad => wad.id} emptyMessage="none" />
        );
        const { unmount } = renderWithProviders(table);
        await user.click(screen.getByRole("button", { name: "Columns" }));
        await user.click(screen.getByRole("switch", { name: "Level" }));
        await user.click(screen.getByRole("switch", { name: "WAD" }));
        unmount();

        // when
        renderWithProviders(table);

        // then
        expect(screen.getByRole("columnheader", { name: "Level" })).toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: "WAD" })).not.toBeInTheDocument();
    });

    it("says what is missing when there are no rows", () => {
        // when
        renderWithProviders(
            <DataTable label="WADs" rows={[]} columns={columns} rowKey={wad => wad.id} emptyMessage="Nothing yet" />,
        );

        // then
        expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    });

    it("picks the clicked row when only one row may be picked", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("single", new Set([1]), onSelectionChange);

        // when
        await user.click(rowOf("Alien Vendetta"));

        // then
        expect(onSelectionChange).toHaveBeenCalledWith(new Set([2]));
    });

    it("clears the selection when the picked row is clicked again", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("single", new Set([1]), onSelectionChange);

        // when
        await user.click(rowOf("Sunlust"));

        // then
        expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it("replaces the selection with the clicked row on a plain click when several rows may be picked", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("multi", new Set([1]), onSelectionChange);

        // when
        await user.click(rowOf("Alien Vendetta"));

        // then
        expect(onSelectionChange).toHaveBeenCalledWith(new Set([2]));
    });

    it("adds a row to the selection on a ctrl click and takes it out on another", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("multi", new Set([1, 2]), onSelectionChange);

        // when
        await user.keyboard("{Control>}");
        await user.click(rowOf("Scythe"));
        await user.click(rowOf("Sunlust"));
        await user.keyboard("{/Control}");

        // then
        expect(onSelectionChange.mock.calls).toEqual([[new Set([1, 2, 3])], [new Set([2])]]);
    });

    it("picks every row between the last clicked row and a shift clicked one", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("multi", new Set(), onSelectionChange);

        // when
        await user.click(rowOf("Sunlust"));
        await user.keyboard("{Shift>}");
        await user.click(rowOf("Scythe"));
        await user.keyboard("{/Shift}");

        // then
        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, 2, 3]));
    });

    it("picks a row from the keyboard", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        renderSelectable("single", new Set(), onSelectionChange);

        // when
        await user.tab();
        await user.tab();
        await user.keyboard("{Enter}");

        // then
        expect(rowOf("Sunlust")).toHaveFocus();
        expect(onSelectionChange).toHaveBeenCalledWith(new Set([1]));
    });

    it("leaves the selection alone when a link inside a row is clicked", async () => {
        // given
        const onSelectionChange = vi.fn();
        const user = userEvent.setup();
        const linked: DataTableColumn<Wad>[] = [
            { key: "name", header: "WAD", render: wad => <a href={`#${wad.id}`}>{wad.name}</a> },
        ];
        renderWithProviders(
            <DataTable
                label="WADs"
                rows={wads}
                columns={linked}
                rowKey={wad => wad.id}
                emptyMessage="none"
                selection="single"
                onSelectionChange={onSelectionChange}
            />,
        );

        // when
        await user.click(screen.getByRole("link", { name: "Sunlust" }));

        // then
        expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("leaves rows out of the tab order when nothing can be picked", () => {
        // when
        renderWithProviders(
            <DataTable label="WADs" rows={wads} columns={columns} rowKey={wad => wad.id} emptyMessage="none" />,
        );

        // then
        expect(rowOf("Sunlust")).not.toHaveAttribute("tabindex");
        expect(rowOf("Sunlust")).not.toHaveAttribute("aria-selected");
    });

    it("renders the toolbar it was given", () => {
        // when
        renderWithProviders(
            <DataTable
                label="WADs"
                rows={wads}
                columns={columns}
                rowKey={wad => wad.id}
                emptyMessage="none"
                toolbar={<Button type="button">Verify</Button>}
            />,
        );

        // then
        expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
    });
});
