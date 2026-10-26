import { HudCell } from "../../components/Hud/Hud";
import { formatDeadline, formatTimeLeft, hasDeadlinePassed } from "../../domain/round/deadline";
import { useRefetchRoundAfterDeadline } from "../../hooks/queries/round";
import { useNow } from "../../hooks/useNow";

type DeadlineCellsProps = {
    endDate: string;
};

export function DeadlineCells({ endDate }: DeadlineCellsProps) {
    const now = useNow(1000);
    useRefetchRoundAfterDeadline(endDate, now);
    const tone = hasDeadlinePassed(endDate, now) ? "red" : "gold";

    return (
        <>
            <HudCell label="Time left" value={formatTimeLeft(endDate, now)} tone={tone} size="small" />
            <HudCell label="Deadline" value={formatDeadline(endDate)} tone={tone} size="small" />
        </>
    );
}
