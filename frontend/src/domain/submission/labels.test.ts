import { describe, expect, it } from "vitest";
import type { SubmissionStatusName } from "../../types/api";
import {
    DOOM_ENGINES,
    engineLabel,
    GZ_ACTIONS,
    gzActionLabels,
    STATUS_OPTIONS,
    statusTone,
    submitterLabel,
    UZDOOM_ENGINE,
} from "./labels";

describe("DOOM_ENGINES", () => {
    it("lists the engines in the order the form offers them, with I don't know last", () => {
        // then
        expect(DOOM_ENGINES.map(engine => engine.label)).toEqual([
            "N/A",
            "Doom II",
            "Ultimate Doom",
            "Final Doom",
            "Boom",
            "MBF",
            "MBF21",
            "Doom 64",
            "GZDoom/UZDoom",
            "I don't know",
        ]);
    });

    it("uses the server's engine numbers", () => {
        // then
        expect(DOOM_ENGINES.map(engine => engine.value)).toEqual([0, 2, 3, 4, 9, 11, 21, 22, -1, -2]);
    });
});

describe("engineLabel", () => {
    it.each([
        [0, "N/A"],
        [3, "Ultimate Doom"],
        [22, "Doom 64"],
        [UZDOOM_ENGINE, "GZDoom/UZDoom"],
        [-2, "I don't know"],
    ])("names engine %i as %s", (value, label) => {
        // then
        expect(engineLabel(value)).toBe(label);
    });

    it("falls back to the engine number when the engine is unknown", () => {
        // then
        expect(engineLabel(99)).toBe("Engine 99");
    });
});

describe("GZ_ACTIONS", () => {
    it("offers jump, crouch and mouse look with the server's numbers", () => {
        // then
        expect(GZ_ACTIONS).toEqual([
            { value: 0, label: "Jump" },
            { value: 1, label: "Crouch" },
            { value: 2, label: "Mouse look" },
        ]);
    });
});

describe("gzActionLabels", () => {
    it("joins the allowed actions with commas", () => {
        // then
        expect(gzActionLabels([0, 2])).toBe("Jump, Mouse look");
    });

    it.each([
        ["no actions", []],
        ["a missing list", null],
    ])("says None for %s", (_description, values) => {
        // then
        expect(gzActionLabels(values)).toBe("None");
    });

    it("falls back to the action number when the action is unknown", () => {
        // then
        expect(gzActionLabels([1, 7])).toBe("Crouch, Action 7");
    });
});

describe("STATUS_OPTIONS", () => {
    it("lists the statuses in the order the admin picks them", () => {
        // then
        expect(STATUS_OPTIONS).toEqual(["Queued", "In Progress", "Rejected", "Completed"]);
    });
});

describe("statusTone", () => {
    it.each<[SubmissionStatusName, string]>([
        ["Rejected", "danger"],
        ["In Progress", "info"],
        ["Completed", "success"],
        ["Queued", "warning"],
    ])("shows %s as %s", (status, tone) => {
        // then
        expect(statusTone(status)).toBe(tone);
    });
});

describe("submitterLabel", () => {
    it("shows the name the submitter chose", () => {
        // then
        expect(submitterLabel("Ray")).toBe("Ray");
    });

    it.each([
        ["no name", null],
        ["an empty name", ""],
        ["a blank name", "   "],
    ])("shows anonymous for %s", (_description, name) => {
        // then
        expect(submitterLabel(name)).toBe("anonymous");
    });
});
