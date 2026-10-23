import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addSubmission, removeSubmissions } from "../../../domain/round/submissions";
import type { CurrentRound } from "../../../types/api";
import { queryKeys } from "../../queryKeys";
import { REALTIME_EVENTS } from "../events";
import { useRealtimeEvent, useRealtimeStatus } from "../useRealtime";

export function useCurrentRoundSync(): void {
    const qc = useQueryClient();
    const epoch = useRealtimeStatus();

    useEffect(() => {
        if (epoch <= 1) {
            return;
        }

        qc.invalidateQueries({ queryKey: queryKeys.round.current() });
    }, [qc, epoch]);

    useRealtimeEvent(REALTIME_EVENTS.NEW_SUBMISSION, event => {
        const submission = { id: event.data.id, WADName: event.data.wadName, level: event.data.wadLevel };

        qc.setQueryData<CurrentRound | null>(queryKeys.round.current(), round =>
            round ? addSubmission(round, submission) : round,
        );
    });

    useRealtimeEvent(REALTIME_EVENTS.DELETE_SUBMISSION, event => {
        qc.setQueryData<CurrentRound | null>(queryKeys.round.current(), round =>
            round ? removeSubmissions(round, event.data) : round,
        );
    });
}
