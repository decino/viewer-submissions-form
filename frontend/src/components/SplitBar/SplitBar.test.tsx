import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { SplitBar } from "./SplitBar";

describe("SplitBar", () => {
    it("lists each slice with its count and share in the legend", () => {
        // when
        renderWithProviders(
            <SplitBar
                title="Recorded format"
                emptyMessage="No data yet"
                slices={[
                    { label: "Practised", value: 3, tone: "green" },
                    { label: "Blind", value: 1, tone: "red" },
                ]}
            />,
        );

        // then
        expect(screen.getByText("Recorded format")).toBeInTheDocument();
        expect(screen.getByText("3 (75%)")).toBeInTheDocument();
        expect(screen.getByText("1 (25%)")).toBeInTheDocument();
    });

    it("says there is nothing to show when every slice is zero", () => {
        // when
        renderWithProviders(
            <SplitBar
                title="Map author"
                emptyMessage="No data yet"
                slices={[
                    { label: "Yes", value: 0, tone: "gold" },
                    { label: "No", value: 0, tone: "blue" },
                ]}
            />,
        );

        // then
        expect(screen.getByText("No data yet")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});
