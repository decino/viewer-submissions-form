import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { SuccessResponse } from "../../types/api";
import { ConfirmSubmissionPage } from "./ConfirmSubmissionPage";

const mocks = vi.hoisted(() => ({
    useSubmissionConfirmation: vi.fn(),
}));

vi.mock("../../hooks/queries/submission", () => ({ useSubmissionConfirmation: mocks.useSubmissionConfirmation }));

const confirmed: SuccessResponse = {
    success: true,
    description:
        "Your submission has been submitted and is awaiting manual verification. It will show as soon as it is verified.",
};

const missingCode = "This link is missing its confirmation code. Use the link from your email.";

function stubConfirmation(result: SuccessResponse | null, error: string | null = null, loading = false): void {
    mocks.useSubmissionConfirmation.mockReturnValue({ result, error, loading });
}

beforeEach(() => {
    mocks.useSubmissionConfirmation.mockReset();
    stubConfirmation(confirmed);
});

describe("ConfirmSubmissionPage", () => {
    it("confirms the code carried by the link from the email", () => {
        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(mocks.useSubmissionConfirmation).toHaveBeenCalledWith("3f2a-uid");
    });

    it("says it is confirming while the server checks the code", () => {
        // given
        stubConfirmation(null, null, true);

        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(screen.getByText("Confirming your submission...")).toBeInTheDocument();
        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("shows the server's answer once the submission is confirmed", () => {
        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(screen.getByRole("heading", { name: "Submission confirmed" })).toBeInTheDocument();
        expect(screen.getByText(confirmed.description)).toBeInTheDocument();
    });

    it("shows why the confirmation failed", () => {
        // given
        const reason = "Unable to find submission with ID: 3f2a-uid. It may have expired.";
        stubConfirmation(null, reason);

        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(screen.getByRole("heading", { name: "Confirmation failed" })).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(reason);
    });

    it("explains a link without a confirmation code and confirms nothing", () => {
        // given
        stubConfirmation(null);

        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission" });

        // then
        expect(screen.getByText(missingCode)).toBeInTheDocument();
        expect(mocks.useSubmissionConfirmation).toHaveBeenCalledWith(null);
    });

    it("treats an empty confirmation code as a missing one", () => {
        // given
        stubConfirmation(null);

        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=" });

        // then
        expect(screen.getByText(missingCode)).toBeInTheDocument();
        expect(mocks.useSubmissionConfirmation).toHaveBeenCalledWith(null);
    });

    it("links back to the current round once the confirmation has settled", () => {
        // given
        stubConfirmation(null, "This link has expired. Submit your entry again.");

        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(screen.getByRole("link", { name: "Back to the current round" })).toHaveAttribute("href", "/");
    });

    it("names itself in the browser tab", () => {
        // when
        renderWithProviders(<ConfirmSubmissionPage />, { route: "/processSubmission?uid=3f2a-uid" });

        // then
        expect(document.title).toBe("Confirm submission | Viewer Submissions");
    });
});
