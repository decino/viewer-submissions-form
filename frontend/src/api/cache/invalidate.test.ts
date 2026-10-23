import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createTestQueryClient } from "../../test-utils/render";
import { queryKeys } from "../queryKeys";
import { invalidateViews, type ViewDomain } from "./invalidate";

function seededClient(): QueryClient {
    const qc = createTestQueryClient();
    const keys: QueryKey[] = [
        queryKeys.round.current(),
        queryKeys.round.previous(),
        queryKeys.stats.round(3),
        queryKeys.config.captcha(),
        queryKeys.config.upload(),
        queryKeys.auth.me(),
        queryKeys.submission.confirmation("uid-1"),
        queryKeys.submission.doomworldPage("https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust"),
        queryKeys.admin.activeRound(),
        queryKeys.admin.previousRounds(),
        queryKeys.admin.submission(7),
        queryKeys.admin.wadValidation(),
    ];
    for (const key of keys) {
        qc.setQueryDefaults(key, { gcTime: Infinity });
        qc.setQueryData(key, {});
    }

    return qc;
}

function invalidatedKeys(qc: QueryClient): string[] {
    return qc
        .getQueryCache()
        .findAll()
        .filter(query => query.state.isInvalidated)
        .map(query => JSON.stringify(query.queryKey));
}

describe("invalidateViews", () => {
    it.each<{ domain: ViewDomain; want: QueryKey[] }>([
        {
            domain: "round",
            want: [
                queryKeys.round.current(),
                queryKeys.round.previous(),
                queryKeys.stats.round(3),
                queryKeys.admin.activeRound(),
                queryKeys.admin.previousRounds(),
                queryKeys.admin.submission(7),
                queryKeys.admin.wadValidation(),
            ],
        },
        {
            domain: "settings",
            want: [queryKeys.admin.wadValidation(), queryKeys.config.upload()],
        },
    ])("refreshes every view of $domain and nothing else", ({ domain, want }) => {
        // given a cache holding a view of every query the app makes
        const qc = seededClient();

        // when
        invalidateViews(qc, domain);

        // then
        expect(invalidatedKeys(qc).sort()).toEqual(want.map(key => JSON.stringify(key)).sort());
    });
});
