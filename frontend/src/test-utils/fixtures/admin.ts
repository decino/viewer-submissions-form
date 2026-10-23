import type { AdminRound, AdminSubmission } from "../../types/api";

export function makeAdminSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id: 1,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        WADName: "Sunlust",
        level: "MAP01",
        authorName: null,
        submissionRoundId: 7,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: null,
        WAD: null,
        engine: 0,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "player@example.com",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

export function makeAdminRound(overrides: Partial<AdminRound> = {}): AdminRound {
    return {
        id: 7,
        created: "2026-10-01T12:00:00.000Z",
        updated: "2026-10-01T12:00:00.000Z",
        active: true,
        name: "Round 7",
        paused: false,
        endDate: null,
        submissions: [],
        ...overrides,
    };
}
