import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../components/Button/Button";
import { UZDOOM_ENGINE } from "../../domain/submission/labels";
import { makeAdminSubmission } from "../../test-utils/fixtures";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminSubmission } from "../../types/api";
import { EntryPanel } from "./EntryPanel";

function renderPanel(submission: AdminSubmission, streaming = false, onClose = vi.fn()) {
    renderWithProviders(
        <EntryPanel submission={submission} streaming={streaming} onClose={onClose}>
            <Button type="button">Edit details</Button>
        </EntryPanel>,
    );
}

function fact(label: string): string | null {
    const term = screen.getByText(label, { selector: "dt" });

    return term.nextElementSibling?.textContent ?? null;
}

describe("EntryPanel", () => {
    it("names the entry, its level and who sent it when", () => {
        // when
        renderPanel(makeAdminSubmission({ WADName: "Sunlust", level: "MAP14", authorName: "gloomhound" }));

        // then
        const panel = within(screen.getByRole("region", { name: "Sunlust" }));
        expect(panel.getByRole("heading", { name: "Sunlust" })).toBeInTheDocument();
        expect(panel.getByText("MAP14")).toBeInTheDocument();
        expect(panel.getByText("sent by gloomhound on 1st of October 2026 at 12:00 UTC")).toBeInTheDocument();
    });

    it("lists the facts about the entry", () => {
        // when
        renderPanel(
            makeAdminSubmission({
                id: 42,
                engine: 9,
                playTestEngine: "Woof! 15",
                recordedFormat: "Blind",
                author: true,
                distributable: true,
            }),
        );

        // then
        expect(fact("Compatibility")).toBe("Boom");
        expect(fact("Tested on")).toBe("Woof! 15");
        expect(fact("Format")).toBe("Blind");
        expect(fact("Made it")).toBe("Yes");
        expect(fact("May share")).toBe("Yes");
        expect(fact("ID")).toBe("42");
        expect(screen.queryByText("GZDoom actions")).not.toBeInTheDocument();
    });

    it("lists the GZDoom actions only for GZDoom entries", () => {
        // when
        renderPanel(makeAdminSubmission({ engine: UZDOOM_ENGINE, gzDoomAction: [0, 2] }));

        // then
        expect(fact("GZDoom actions")).toBe("Jump, Mouse look");
    });

    it("shows the email address behind a spoiler", () => {
        // when
        renderPanel(makeAdminSubmission({ email: "varn@example.test" }));

        // then
        expect(fact("Email")).toBe("varn@example.test");
    });

    it("leaves the email address out while streaming", () => {
        // when
        renderPanel(makeAdminSubmission({ email: "varn@example.test" }), true);

        // then
        expect(screen.queryByText("Email")).not.toBeInTheDocument();
        expect(screen.queryByText("varn@example.test")).not.toBeInTheDocument();
    });

    it("names the uploaded file and links to its download", () => {
        // when
        renderPanel(makeAdminSubmission({ id: 3, submissionRoundId: 7, customWad: "ossuary.zip" }));

        // then
        expect(screen.getByText("ossuary.zip")).toBeInTheDocument();
        expect(screen.getByText("Uploaded file")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute("href", "/rest/submission/download/7/3");
    });

    it("shows the whole text the sender wrote about the level", () => {
        // given
        const essay = "A long story about the map. ".repeat(60).trim();

        // when
        renderPanel(makeAdminSubmission({ info: essay }));

        // then
        expect(screen.getByRole("heading", { name: "About the level" })).toBeInTheDocument();
        expect(screen.getByText(essay)).toBeInTheDocument();
    });

    it("shows the status of a picked entry", () => {
        // when
        renderPanel(
            makeAdminSubmission({ status: { status: "Rejected", additionalInfo: "Crashes on load", submissionId: 1 } }),
        );

        // then
        expect(screen.getByText("Rejected")).toBeInTheDocument();
        expect(screen.getByText("Crashes on load")).toBeInTheDocument();
    });

    it("shows the actions it was given and closes on request", async () => {
        // given
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderPanel(makeAdminSubmission(), false, onClose);

        // when
        await user.click(screen.getByRole("button", { name: "Close" }));

        // then
        expect(screen.getByRole("button", { name: "Edit details" })).toBeInTheDocument();
        expect(onClose).toHaveBeenCalledOnce();
    });
});
