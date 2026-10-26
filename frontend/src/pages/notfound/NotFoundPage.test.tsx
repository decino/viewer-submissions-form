import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
    it("tells the visitor the page is missing and links back to the round", () => {
        // when
        renderWithProviders(<NotFoundPage />, { route: "/e1m10" });

        // then
        expect(screen.getByRole("heading", { name: "This level doesn't exist" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to the current round" })).toHaveAttribute("href", "/");
    });

    it("names itself in the browser tab", () => {
        // when
        renderWithProviders(<NotFoundPage />);

        // then
        expect(document.title).toBe("Not found | Viewer Submissions");
    });
});
