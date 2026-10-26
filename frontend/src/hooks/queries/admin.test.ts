import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubmission } from "../../api/endpoints/submission";
import { getActiveRoundForAdmin, getRoundsForAdmin } from "../../api/endpoints/submissionRound";
import { getWadValidation } from "../../api/endpoints/utils";
import { createTestQueryClient, providerWrapper } from "../../test-utils/render";
import type { AdminRound, AdminSubmission, WadValidation } from "../../types/api";
import { useAdminActiveRound, useAdminPreviousRounds, useAdminSubmission, useWadValidation } from "./admin";

vi.mock("../../api/endpoints/submission", () => ({
    getSubmission: vi.fn(),
}));

vi.mock("../../api/endpoints/submissionRound", () => ({
    getActiveRoundForAdmin: vi.fn(),
    getRoundsForAdmin: vi.fn(),
}));

vi.mock("../../api/endpoints/utils", () => ({
    getWadValidation: vi.fn(),
}));

const mockedGetSubmission = vi.mocked(getSubmission);
const mockedGetActiveRoundForAdmin = vi.mocked(getActiveRoundForAdmin);
const mockedGetRoundsForAdmin = vi.mocked(getRoundsForAdmin);
const mockedGetWadValidation = vi.mocked(getWadValidation);

function makeSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 7,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: "Sunlust",
        level: "MAP12",
        authorName: "doomguy",
        submissionRoundId: 4,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: "dsda-doom",
        WAD: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: false,
        ...overrides,
    };
}

function makeRound(overrides: Partial<AdminRound> = {}): AdminRound {
    return {
        id: 4,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        active: true,
        name: "Round 4",
        paused: false,
        endDate: null,
        submissions: [makeSubmission()],
        ...overrides,
    };
}

const validation: WadValidation = {
    allowedExtensions: ["wad", "zip"],
    allowedHeaders: ["PWAD", "PK%03%04"],
    allowedExtensionsZip: ["wad"],
    allowedHeadersZip: [null],
};

beforeEach(() => {
    mockedGetSubmission.mockResolvedValue(makeSubmission());
    mockedGetActiveRoundForAdmin.mockResolvedValue(makeRound());
    mockedGetRoundsForAdmin.mockResolvedValue([makeRound({ id: 3, name: "Round 3", active: false })]);
    mockedGetWadValidation.mockResolvedValue(validation);
});

describe("useAdminActiveRound", () => {
    it("keys the query as the admin view of the active round", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useAdminActiveRound(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["admin", "active-round"]);
    });

    it("hands back the active round with every submission", async () => {
        // when
        const { result } = renderHook(() => useAdminActiveRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.round).toEqual(makeRound());
    });

    it("reports no round when none is active", async () => {
        // given
        mockedGetActiveRoundForAdmin.mockResolvedValue(null);

        // when
        const { result } = renderHook(() => useAdminActiveRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.round).toBeNull();
    });

    it("reports loading and no round while the request is in flight", () => {
        // given
        mockedGetActiveRoundForAdmin.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useAdminActiveRound(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ round: null, loading: true, error: null });
    });

    it("hands back the reason the active round could not be loaded", async () => {
        // given
        mockedGetActiveRoundForAdmin.mockRejectedValue(new Error("Your session has expired. Log in again."));

        // when
        const { result } = renderHook(() => useAdminActiveRound(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({
            round: null,
            loading: false,
            error: "Your session has expired. Log in again.",
        });
    });
});

describe("useAdminPreviousRounds", () => {
    it("keys the query as the admin view of the previous rounds", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useAdminPreviousRounds(), {
            wrapper: providerWrapper({ queryClient: qc }),
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["admin", "previous-rounds"]);
    });

    it("asks for the finished rounds only, leaving the active one out", async () => {
        // when
        const { result } = renderHook(() => useAdminPreviousRounds(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(mockedGetRoundsForAdmin).toHaveBeenCalledWith(false);
        expect(result.current.rounds).toEqual([makeRound({ id: 3, name: "Round 3", active: false })]);
    });

    it("reports loading and an empty list while the request is in flight", () => {
        // given
        mockedGetRoundsForAdmin.mockReturnValue(new Promise(() => {}));

        // when
        const { result } = renderHook(() => useAdminPreviousRounds(), { wrapper: providerWrapper() });

        // then
        expect(result.current).toEqual({ rounds: [], loading: true, error: null });
    });

    it("hands back the reason the previous rounds could not be loaded", async () => {
        // given
        mockedGetRoundsForAdmin.mockRejectedValue(new Error("Your session has expired. Log in again."));

        // when
        const { result } = renderHook(() => useAdminPreviousRounds(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({
            rounds: [],
            loading: false,
            error: "Your session has expired. Log in again.",
        });
    });
});

describe("useAdminSubmission", () => {
    it("keys the query by the submission it is given", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useAdminSubmission(7), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["admin", "submission", 7]);
    });

    it("asks for the submission it is given and hands it back", async () => {
        // when
        const { result } = renderHook(() => useAdminSubmission(7), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(mockedGetSubmission).toHaveBeenCalledWith(7);
        expect(result.current.submission).toEqual(makeSubmission());
    });

    it("asks for nothing until a submission is picked", () => {
        // when
        const { result } = renderHook(() => useAdminSubmission(null), { wrapper: providerWrapper() });

        // then
        expect(mockedGetSubmission).not.toHaveBeenCalled();
        expect(result.current).toEqual({ submission: null, loading: false, error: null });
    });

    it("hands back the reason the submission could not be loaded", async () => {
        // given
        mockedGetSubmission.mockRejectedValue(new Error("Unable to find submission with ID: 7"));

        // when
        const { result } = renderHook(() => useAdminSubmission(7), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({
            submission: null,
            loading: false,
            error: "Unable to find submission with ID: 7",
        });
    });
});

describe("useWadValidation", () => {
    it("keys the query as the WAD validation rules", async () => {
        // given
        const qc = createTestQueryClient();

        // when
        const { result } = renderHook(() => useWadValidation(), { wrapper: providerWrapper({ queryClient: qc }) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(qc.getQueryCache().getAll()[0].queryKey).toEqual(["admin", "wad-validation"]);
    });

    it("hands back the rules", async () => {
        // when
        const { result } = renderHook(() => useWadValidation(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current.validation).toEqual(validation);
    });

    it("hands back the reason the rules could not be loaded", async () => {
        // given
        mockedGetWadValidation.mockRejectedValue(new Error("Your session has expired. Log in again."));

        // when
        const { result } = renderHook(() => useWadValidation(), { wrapper: providerWrapper() });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // then
        expect(result.current).toEqual({
            validation: null,
            loading: false,
            error: "Your session has expired. Log in again.",
        });
    });
});
