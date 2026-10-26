import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { RoundTitle } from "./RoundTitle";

describe("RoundTitle", () => {
    it("shows the round name as the page heading", () => {
        // when
        renderWithProviders(<RoundTitle>Round 42: E1M1 enjoyers</RoundTitle>);

        // then
        expect(screen.getByRole("heading", { level: 1, name: "Round 42: E1M1 enjoyers" })).toBeInTheDocument();
    });
});
