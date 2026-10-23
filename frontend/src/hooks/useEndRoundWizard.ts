import { useEffect, useRef, useState } from "react";
import { duplicateIds } from "../domain/submission/admin";
import type { AdminSubmission } from "../types/api";
import { errorMessage } from "../utils/errorMessage";
import { readStored, writeStored } from "../utils/storage";
import { useBuildResultSet, useGenerateEntries, usePauseRound, useSubmitEntries } from "./mutations/round";

export const END_ROUND_STEPS = ["pause", "pick", "review"] as const;

export type EndRoundStep = (typeof END_ROUND_STEPS)[number];

export interface PickedEntry {
    key: number;
    entry: AdminSubmission;
}

type StoredWizard = {
    roundId: number;
    step: EndRoundStep;
    picks: PickedEntry[];
};

export const WIZARD_KEY = "end-round-wizard";

function restoreWizard(roundId: number): StoredWizard | null {
    const stored = readStored<StoredWizard>("session", WIZARD_KEY);

    return stored?.roundId === roundId ? stored : null;
}

function leftToPick(count: number): string {
    if (count === 0) {
        return "No WADs are left to pick from";
    }

    if (count === 1) {
        return "Only 1 WAD is left to pick from";
    }

    return `Only ${count} WADs are left to pick from`;
}

function pickBlocker(picks: readonly PickedEntry[], duplicates: ReadonlySet<number>): string | null {
    if (duplicates.size > 0) {
        return "Remove duplicate entries before continuing";
    }

    if (picks.length === 0) {
        return "Pick at least one entry";
    }

    return null;
}

export function useEndRoundWizard(roundId: number, paused: boolean, onFinished: () => void) {
    const pauseMutation = usePauseRound();
    const buildMutation = useBuildResultSet();
    const generateMutation = useGenerateEntries();
    const submitMutation = useSubmitEntries();
    const [restored] = useState(() => restoreWizard(roundId));
    const lastKey = useRef(Math.max(0, ...(restored?.picks ?? []).map(pick => pick.key)));
    const [step, setStep] = useState<EndRoundStep>(restored?.step ?? "pause");
    const [built, setBuilt] = useState(false);
    const [picks, setPicks] = useState<PickedEntry[]>(restored?.picks ?? []);
    const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStored("session", WIZARD_KEY, { roundId, step, picks });
    }, [roundId, step, picks]);

    const duplicates = duplicateIds(picks.map(pick => pick.entry.id));
    const blocker = step === "pick" ? pickBlocker(picks, duplicates) : null;
    const working = buildMutation.isPending || submitMutation.isPending;
    const nextDisabled = working || (step === "pause" && !paused) || blocker !== null;

    function toPicks(entries: readonly AdminSubmission[]): PickedEntry[] {
        return entries.map(entry => {
            lastKey.current += 1;
            return { key: lastKey.current, entry };
        });
    }

    async function pause() {
        setError(null);

        try {
            await pauseMutation.mutateAsync(true);
        } catch (caught) {
            setError(errorMessage(caught, "Could not pause the round."));
        }
    }

    async function generate(count: number): Promise<AdminSubmission[] | null> {
        setError(null);

        try {
            return await generateMutation.mutateAsync(count);
        } catch (caught) {
            setError(errorMessage(caught, "Could not draw random entries."));
            return null;
        }
    }

    async function addRandom() {
        const entries = await generate(1);
        if (entries === null) {
            return;
        }

        if (entries.length === 0) {
            setError(leftToPick(0));
            return;
        }

        const added = toPicks(entries);
        setPicks(previous => [...previous, ...added]);
    }

    async function rerollSelected() {
        const targets = picks.filter(pick => selected.has(pick.key)).map(pick => pick.key);
        if (targets.length === 0) {
            return;
        }

        const entries = await generate(targets.length);
        if (entries === null) {
            return;
        }

        const replacements = new Map<number, AdminSubmission>();
        for (const [index, key] of targets.slice(0, entries.length).entries()) {
            replacements.set(key, entries[index]);
        }

        setPicks(previous =>
            previous.map(pick => {
                const entry = replacements.get(pick.key);
                return entry ? { key: pick.key, entry } : pick;
            }),
        );
        setSelected(new Set(targets.slice(entries.length)));

        if (entries.length < targets.length) {
            setError(leftToPick(entries.length));
        }
    }

    function removeSelected() {
        setError(null);
        setPicks(previous => previous.filter(pick => !selected.has(pick.key)));
        setSelected(new Set());
    }

    function back() {
        if (working) {
            return;
        }

        setError(null);
        setStep(END_ROUND_STEPS[Math.max(END_ROUND_STEPS.indexOf(step) - 1, 0)]);
    }

    async function next() {
        if (nextDisabled) {
            return;
        }

        setError(null);

        if (step === "pause") {
            if (!built) {
                try {
                    await buildMutation.mutateAsync();
                } catch (caught) {
                    setError(errorMessage(caught, "Could not prepare the entries to pick from."));
                    return;
                }

                setBuilt(true);
            }

            setStep("pick");
            return;
        }

        if (step === "pick") {
            setStep("review");
            return;
        }

        try {
            await submitMutation.mutateAsync(picks.map(pick => pick.entry.id));
        } catch (caught) {
            setError(errorMessage(caught, "Could not save the winners."));
            return;
        }

        setStep("pause");
        setBuilt(false);
        setPicks([]);
        setSelected(new Set());
        onFinished();
    }

    return {
        step,
        error,
        pause,
        pausing: pauseMutation.isPending,
        picks,
        selected,
        select: setSelected,
        duplicates,
        addRandom,
        rerollSelected,
        removeSelected,
        generating: generateMutation.isPending,
        blocker,
        back,
        next,
        nextDisabled,
    };
}
