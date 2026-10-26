import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { DownloadLink } from "./DownloadLink";

describe("DownloadLink", () => {
    it("links to the WAD in a new tab", () => {
        // when
        renderWithProviders(<DownloadLink url="https://example.com/sunlust.zip" />);

        // then
        const link = screen.getByRole("link", { name: "Download" });
        expect(link).toHaveAttribute("href", "https://example.com/sunlust.zip");
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("says N/A when the WAD may not be downloaded", () => {
        // when
        renderWithProviders(<DownloadLink url={null} />);

        // then
        expect(screen.getByText("N/A")).toBeInTheDocument();
    });
});
