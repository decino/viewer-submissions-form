import { describe, expect, it } from "vitest";
import { makeAdminSubmission } from "../../test-utils/fixtures/admin";
import { browseEntries, isEntryOrder } from "./browse";

const entries = [
    makeAdminSubmission({
        id: 1,
        WADName: "Sunlust",
        level: "MAP14",
        authorName: "gloomhound",
        created: "2026-10-02T10:00:00.000Z",
    }),
    makeAdminSubmission({
        id: 2,
        WADName: "eviternity II",
        level: "MAP28",
        authorName: null,
        created: "2026-10-03T10:00:00.000Z",
    }),
    makeAdminSubmission({
        id: 3,
        WADName: "Alien Vendetta",
        level: "MAP20",
        authorName: "Varn",
        created: "2026-10-01T10:00:00.000Z",
    }),
];

function ids(order: Parameters<typeof browseEntries>[2], search = ""): number[] {
    return browseEntries(entries, search, order).map(entry => entry.id);
}

describe("browseEntries", () => {
    it("puts the newest entry first", () => {
        // then
        expect(ids("newest")).toEqual([2, 1, 3]);
    });

    it("puts the oldest entry first", () => {
        // then
        expect(ids("oldest")).toEqual([3, 1, 2]);
    });

    it("orders by WAD name without caring about case", () => {
        // then
        expect(ids("wad")).toEqual([3, 2, 1]);
    });

    it("orders by sender, counting a nameless sender as anonymous", () => {
        // then
        expect(ids("sender")).toEqual([2, 1, 3]);
    });

    it("keeps the entries whose WAD, level or sender match the search", () => {
        // then
        expect(ids("oldest", "map2")).toEqual([3, 2]);
        expect(ids("oldest", "  VARN ")).toEqual([3]);
        expect(ids("oldest", "anonymous")).toEqual([2]);
    });

    it("leaves the entries it was given untouched", () => {
        // when
        browseEntries(entries, "", "wad");

        // then
        expect(entries.map(entry => entry.id)).toEqual([1, 2, 3]);
    });
});

describe("isEntryOrder", () => {
    it("knows the orders it can sort by", () => {
        // then
        expect(isEntryOrder("sender")).toBe(true);
        expect(isEntryOrder("rating")).toBe(false);
        expect(isEntryOrder(null)).toBe(false);
    });
});
