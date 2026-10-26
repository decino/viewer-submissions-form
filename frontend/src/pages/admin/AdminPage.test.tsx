import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../components/Button/Button";
import { makeAdminRound, makeAdminSubmission } from "../../test-utils/fixtures";
import { renderWithProviders } from "../../test-utils/render";
import type { AdminRound } from "../../types/api";
import { AdminPage } from "./AdminPage";

type TableProps = {
    round: AdminRound;
    table: string;
    streaming: boolean;
};

const mocks = vi.hoisted(() => ({
    useAdminActiveRound: vi.fn(),
}));

vi.mock("../../hooks/queries/admin", () => ({ useAdminActiveRound: mocks.useAdminActiveRound }));
vi.mock("../../components/RoundStatsCharts/RoundStatsCharts", () => ({
    RoundStatsCharts: ({ roundId }: { roundId: number }) => <p>Statistics of round {roundId}</p>,
}));
vi.mock("./RoundHeader", () => ({
    RoundHeader: ({ round, onEndRound }: { round: AdminRound; onEndRound: () => void }) => (
        <div>
            <p>Header of {round.name}</p>
            <Button type="button" onClick={onEndRound}>
                End round
            </Button>
        </div>
    ),
}));
vi.mock("./CreateRoundPanel", () => ({
    CreateRoundPanel: () => <p>Create a round</p>,
}));
vi.mock("./SubmissionTables", () => ({
    SubmissionTables: ({ round, table, streaming }: TableProps) => (
        <p>{`Table ${table} of ${round.name}${streaming ? " while streaming" : ""}`}</p>
    ),
}));
vi.mock("./PreviousRoundsAdmin", () => ({
    PreviousRoundsAdmin: ({ streaming }: { streaming: boolean }) => (
        <p>{`Previous rounds${streaming ? " while streaming" : ""}`}</p>
    ),
}));
vi.mock("./EndRoundWizard", () => ({
    EndRoundWizard: ({ open, onClose, round }: { open: boolean; onClose: () => void; round: AdminRound }) =>
        open ? (
            <div role="dialog" aria-label="End round">
                Ending {round.name}
                <Button type="button" onClick={onClose}>
                    Close wizard
                </Button>
            </div>
        ) : null,
}));

const round = makeAdminRound({
    id: 5,
    name: "Round 5: slaughter season",
    submissions: [
        makeAdminSubmission({ id: 1, verified: false }),
        makeAdminSubmission({ id: 2, verified: false }),
        makeAdminSubmission({ id: 3 }),
    ],
});

function stubRound(active: AdminRound | null, loading = false, error: string | null = null): void {
    mocks.useAdminActiveRound.mockReturnValue({ round: active, loading, error });
}

beforeEach(() => {
    stubRound(round);
});

describe("AdminPage", () => {
    it("says it is loading while the active round is on its way", () => {
        // given
        stubRound(null, true);

        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByText("Loading the active round...")).toBeInTheDocument();
        expect(screen.queryByText("Create a round")).not.toBeInTheDocument();
    });

    it("shows why the active round could not be loaded instead of offering a new one", () => {
        // given
        stubRound(null, false, "Could not load the active round.");

        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the active round.");
        expect(screen.queryByText("Create a round")).not.toBeInTheDocument();
    });

    it("shows the active round, its statistics and the entries to verify", () => {
        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByText("Header of Round 5: slaughter season")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Round statistics" })).toBeInTheDocument();
        expect(screen.getByText("Statistics of round 5")).toBeInTheDocument();
        expect(screen.getByText("Table unverified of Round 5: slaughter season")).toBeInTheDocument();
    });

    it("counts the entries on their tabs", () => {
        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByRole("tab", { name: "To verify 2" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: "Entries 1" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Past rounds" })).toBeInTheDocument();
    });

    it("switches to the tab that was picked", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<AdminPage />);

        // when
        await user.click(screen.getByRole("tab", { name: "Entries 1" }));

        // then
        expect(screen.getByText("Table current of Round 5: slaughter season")).toBeInTheDocument();
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Entries 1");
    });

    it("offers to create a round and only the past rounds when none is active", () => {
        // given
        stubRound(null);

        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByText("Create a round")).toBeInTheDocument();
        expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Past rounds"]);
        expect(screen.getByText("Previous rounds")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Round statistics" })).not.toBeInTheDocument();
    });

    it("hands streaming to the tables and remembers it", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<AdminPage />);

        // when
        await user.click(screen.getByRole("switch", { name: "Streaming" }));

        // then
        expect(screen.getByText("Table unverified of Round 5: slaughter season while streaming")).toBeInTheDocument();
        expect(localStorage.getItem("admin-streaming")).toBe("true");
    });

    it("starts streaming when it was left on", () => {
        // given
        localStorage.setItem("admin-streaming", "true");
        stubRound(null);

        // when
        renderWithProviders(<AdminPage />);

        // then
        expect(screen.getByRole("switch", { name: "Streaming" })).toHaveAttribute("aria-checked", "true");
        expect(screen.getByText("Previous rounds while streaming")).toBeInTheDocument();
    });

    it("opens the end round wizard for the active round", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<AdminPage />);

        // when
        await user.click(screen.getByRole("button", { name: "End round" }));

        // then
        expect(screen.getByRole("dialog", { name: "End round" })).toHaveTextContent("Ending Round 5: slaughter season");
    });

    it("closes the end round wizard when it asks to close", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<AdminPage />);
        await user.click(screen.getByRole("button", { name: "End round" }));

        // when
        await user.click(
            within(screen.getByRole("dialog", { name: "End round" })).getByRole("button", { name: "Close wizard" }),
        );

        // then
        expect(screen.queryByRole("dialog", { name: "End round" })).not.toBeInTheDocument();
    });
});
