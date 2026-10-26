import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addSubmission, removeSubmissions } from "../../../domain/round/submissions";
import type { CurrentRound } from "../../../types/api";
import { queryKeys } from "../../queryKeys";
import { isDeleteSubmissionPayload, isNewSubmissionPayload } from "../events";
import { submissionSocket } from "../socket";

export function useCurrentRoundSync(): void {
    const qc = useQueryClient();

    useEffect(() => {
        const key = queryKeys.round.current();

        function added(data: unknown) {
            if (!isNewSubmissionPayload(data)) {
                return;
            }

            const submission = { id: data.id, WADName: data.wadName, level: data.wadLevel };
            qc.setQueryData<CurrentRound | null>(key, round => (round ? addSubmission(round, submission) : round));
        }

        function deleted(data: unknown) {
            if (!isDeleteSubmissionPayload(data)) {
                return;
            }

            qc.setQueryData<CurrentRound | null>(key, round => (round ? removeSubmissions(round, data) : round));
        }

        submissionSocket.on("newSubmission", added);
        submissionSocket.on("deleteSubmission", deleted);
        submissionSocket.io.on("reconnect", () => qc.invalidateQueries({ queryKey: key }));

        return () => {
            submissionSocket.off("newSubmission", added);
            submissionSocket.off("deleteSubmission", deleted);
            submissionSocket.io.off("reconnect");
        };
    }, [qc]);
}
