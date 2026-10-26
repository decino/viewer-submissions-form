import { describe, expect, it } from "vitest";
import { formatDeadline, formatRoundStart, formatTimeLeft, hasDeadlinePassed, ordinalSuffix } from "./deadline";

describe("ordinalSuffix", () => {
    it.each([
        [1, "st"],
        [2, "nd"],
        [3, "rd"],
        [4, "th"],
        [11, "th"],
        [12, "th"],
        [13, "th"],
        [21, "st"],
        [22, "nd"],
        [23, "rd"],
        [30, "th"],
        [31, "st"],
    ])("gives day %i the suffix %s", (day, suffix) => {
        // then
        expect(ordinalSuffix(day)).toBe(suffix);
    });
});

describe("hasDeadlinePassed", () => {
    const endDate = "2026-11-03T23:59:59.000Z";
    const deadline = new Date(endDate).getTime();

    it("is still open a second before the stored deadline", () => {
        // then
        expect(hasDeadlinePassed(endDate, deadline - 1000)).toBe(false);
    });

    it("has passed at the stored deadline itself", () => {
        // then
        expect(hasDeadlinePassed(endDate, deadline)).toBe(true);
    });
});

describe("formatTimeLeft", () => {
    const endDate = "2026-10-30T20:00:00.000Z";
    const deadline = new Date(endDate).getTime();
    const minutes = (count: number) => count * 60_000;

    it.each([
        ["days and hours when more than a day is left", minutes(7 * 24 * 60 + 2 * 60 + 30), "7d 02h"],
        ["hours and minutes when less than a day is left", minutes(5 * 60 + 7), "5h 07m"],
        ["minutes when less than an hour is left", minutes(42), "42m"],
        ["a minute when less than a minute is left", 30_000, "1m"],
    ])("shows %s", (_case, remaining, expected) => {
        // then
        expect(formatTimeLeft(endDate, deadline - remaining)).toBe(expected);
    });

    it("says the round has closed once the deadline is reached", () => {
        // then
        expect(formatTimeLeft(endDate, deadline)).toBe("Closed");
    });
});

describe("formatRoundStart", () => {
    it("writes the UTC date and time a round started", () => {
        // then
        expect(formatRoundStart("2025-05-03T14:05:00.000Z")).toBe("3rd of May 2025 at 14:05 UTC");
    });
});

describe("formatDeadline", () => {
    it("writes the UTC calendar date the round closes on", () => {
        // then
        expect(formatDeadline("2026-11-03T23:59:59.000Z")).toBe("3rd of November 2026");
    });

    it("uses the UTC day, not the viewer's local day", () => {
        // then
        expect(formatDeadline("2026-12-31T23:30:00.000Z")).toBe("31st of December 2026");
    });
});
