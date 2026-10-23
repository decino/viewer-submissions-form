import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

const domainViews = {
    round: [queryKeys.round.all, queryKeys.stats.all, queryKeys.admin.all],
    settings: [queryKeys.admin.wadValidation(), queryKeys.config.upload()],
} as const satisfies Record<string, readonly QueryKey[]>;

export type ViewDomain = keyof typeof domainViews;

export function invalidateViews(qc: QueryClient, domain: ViewDomain): void {
    for (const key of domainViews[domain]) {
        qc.invalidateQueries({ queryKey: key });
    }
}
