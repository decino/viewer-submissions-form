const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function ordinalSuffix(day: number): string {
    if (day > 3 && day < 21) {
        return "th";
    }

    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

export function hasDeadlinePassed(endDate: string, now: number): boolean {
    return now >= new Date(endDate).getTime();
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimeLeft(endDate: string, now: number): string {
    const remaining = new Date(endDate).getTime() - now;
    if (remaining <= 0) {
        return "Closed";
    }

    const days = Math.floor(remaining / DAY);
    const hours = Math.floor((remaining % DAY) / HOUR);
    const minutes = Math.floor((remaining % HOUR) / MINUTE);

    if (days > 0) {
        return `${days}d ${String(hours).padStart(2, "0")}h`;
    }
    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }
    return `${Math.max(minutes, 1)}m`;
}

export function formatDeadline(iso: string): string {
    const date = new Date(iso);
    const day = date.getUTCDate();

    return `${day}${ordinalSuffix(day)} of ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatRoundStart(iso: string): string {
    const date = new Date(iso);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${formatDeadline(iso)} at ${hours}:${minutes} UTC`;
}
