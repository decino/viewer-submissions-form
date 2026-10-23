import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ClampedText } from "./ClampedText";

describe("ClampedText", () => {
    it("shows the text as text rather than markup", () => {
        // when
        renderWithProviders(<ClampedText text="<b>Made in a week</b>" />);

        // then
        expect(screen.getByText("<b>Made in a week</b>")).toBeInTheDocument();
    });

    it("renders empty when there is no text", () => {
        // when
        const { container } = renderWithProviders(<ClampedText text={null} />);

        // then
        expect(container).toHaveTextContent("");
    });
});
