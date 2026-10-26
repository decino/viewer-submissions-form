import { type SubmitEvent, useState } from "react";
import { errorMessage } from "../utils/errorMessage";
import { useCreateRound } from "./mutations/round";

export function useCreateRoundForm(onCreated: () => void) {
    const createRound = useCreateRound();
    const [name, setName] = useState("");
    const [endDate, setEndDate] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    function pickEndDate(picked: number) {
        setEndDate(Number.isNaN(picked) ? null : picked);
    }

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmed = name.trim();
        if (trimmed === "") {
            setError("Give the round a name");
            return;
        }

        setError(null);

        try {
            await createRound.mutateAsync({ name: trimmed, endDate: endDate ?? undefined });
            onCreated();
        } catch (failure) {
            setError(errorMessage(failure, "Could not create the round."));
        }
    }

    return {
        name,
        setName,
        pickEndDate,
        error,
        creating: createRound.isPending,
        submit,
    };
}
