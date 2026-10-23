export const queryKeys = {
    round: {
        all: ["round"] as const,
        current: () => ["round", "current"] as const,
        previous: () => ["round", "previous"] as const,
    },
    stats: {
        all: ["stats"] as const,
        round: (roundId: number) => ["stats", "round", roundId] as const,
    },
    config: {
        captcha: () => ["config", "captcha"] as const,
        upload: () => ["config", "upload"] as const,
    },
    auth: {
        me: () => ["auth", "me"] as const,
    },
    submission: {
        confirmation: (uid: string) => ["submission", "confirmation", uid] as const,
        doomworldPage: (url: string) => ["submission", "doomworld-page", url] as const,
    },
    admin: {
        all: ["admin"] as const,
        activeRound: () => ["admin", "active-round"] as const,
        previousRounds: () => ["admin", "previous-rounds"] as const,
        submission: (id: number) => ["admin", "submission", id] as const,
        wadValidation: () => ["admin", "wad-validation"] as const,
    },
};
