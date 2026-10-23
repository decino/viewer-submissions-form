import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";

describe("SubmissionStatusBadge", () => {
    it("says N/A for an entry that has no status yet", () => {
        // when
        renderWithProviders(<SubmissionStatusBadge status={null} youtubeLink={null} />);

        // then
        expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("shows the status on its own when there is no playthrough", () => {
        // when
        renderWithProviders(
            <SubmissionStatusBadge
                status={{ status: "Completed", additionalInfo: null, submissionId: 3 }}
                youtubeLink={null}
            />,
        );

        // then
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("links the status to the playthrough when there is one", () => {
        // when
        renderWithProviders(
            <SubmissionStatusBadge
                status={{ status: "Completed", additionalInfo: null, submissionId: 3 }}
                youtubeLink="https://www.youtube.com/watch?v=abc"
            />,
        );

        // then
        const link = screen.getByRole("link", { name: "Completed" });
        expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc");
        expect(link).toHaveAttribute("title", "Watch the playthrough");
    });
});
