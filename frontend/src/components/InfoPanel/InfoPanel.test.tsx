import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { InfoPanel } from "./InfoPanel";

describe("InfoPanel", () => {
    it("presents its title as a heading", () => {
        // given
        const title = "Before you submit";

        // when
        renderWithProviders(
            <InfoPanel title={title}>
                <p>One WAD per round</p>
            </InfoPanel>,
        );

        // then
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    });

    it("renders its children below the heading", () => {
        // given
        const body = "One WAD per round";

        // when
        renderWithProviders(
            <InfoPanel title="Before you submit">
                <p>{body}</p>
            </InfoPanel>,
        );

        // then
        const heading = screen.getByRole("heading", { name: "Before you submit" });
        const paragraph = screen.getByText(body);
        expect(paragraph).toBeInTheDocument();
        expect(heading.compareDocumentPosition(paragraph) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders several children in the order they were given", () => {
        // given
        const items = ["first rule", "second rule"];

        // when
        renderWithProviders(
            <InfoPanel title="Rules">
                <p>{items[0]}</p>
                <p>{items[1]}</p>
            </InfoPanel>,
        );

        // then
        const paragraphs = screen.getAllByText(/rule$/);
        expect(paragraphs.map(node => node.textContent)).toEqual(items);
    });

    it("renders interactive children that keep working", () => {
        // given
        const markup = (
            <InfoPanel title="Rules">
                <a href="/rules">Read the rules</a>
            </InfoPanel>
        );

        // when
        renderWithProviders(markup);

        // then
        expect(screen.getByRole("link", { name: "Read the rules" })).toHaveAttribute("href", "/rules");
    });
});
