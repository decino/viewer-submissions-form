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

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimeLeft(endDate: string, now: number): string {
    const remaining = new Date(endDate).getTime() - now;
    if (remaining <= 0) {
        return "Closed";
    }

    const days = Math.floor(remaining / DAY);
    const clock = [
        Math.floor((remaining % DAY) / HOUR),
        Math.floor((remaining % HOUR) / MINUTE),
        Math.floor((remaining % MINUTE) / SECOND),
    ]
        .map(part => String(part).padStart(2, "0"))
        .join(":");

    return days > 0 ? `${days}d ${clock}` : clock;
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
