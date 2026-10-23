import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { PrivacyPolicy } from "./PrivacyPolicy";

describe("PrivacyPolicy", () => {
    it("says when the policy last changed", () => {
        // when
        renderWithProviders(<PrivacyPolicy />);

        // then
        expect(screen.getByText("Last updated: 9 September 2023")).toBeInTheDocument();
    });

    it("covers every part of the policy under its own heading", () => {
        // when
        renderWithProviders(<PrivacyPolicy />);

        // then
        expect(screen.getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)).toEqual([
            "Key points",
            "Information we collect",
            "How we use your information",
            "Data sharing and security",
            "Your privacy rights",
            "Retention period",
            "Changes to this policy",
            "Contact us",
        ]);
    });

    it("lists what is collected from a submission", () => {
        // when
        renderWithProviders(<PrivacyPolicy />);

        // then
        expect(screen.getByRole("heading", { name: "Submission information" })).toBeInTheDocument();
        expect(screen.getByText("Email addresses for communication")).toBeInTheDocument();
    });

    it("says how to get in touch about it", () => {
        // when
        renderWithProviders(<PrivacyPolicy />);

        // then
        expect(screen.getByRole("link", { name: "submissions@decino.nl" })).toHaveAttribute(
            "href",
            "mailto:submissions@decino.nl",
        );
        expect(screen.getByRole("link", { name: "submissions.decino.nl" })).toHaveAttribute(
            "href",
            "https://submissions.decino.nl",
        );
    });
});
