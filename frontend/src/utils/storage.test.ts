import { describe, expect, it } from "vitest";
import { readStored, removeStored, writeStored } from "./storage";

describe("storage", () => {
    it("has nothing to read before anything was written", () => {
        // then
        expect(readStored("local", "streaming")).toBeNull();
    });

    it("reads back what it wrote", () => {
        // when
        writeStored("session", "draft", { wadName: "Sunlust" });

        // then
        expect(readStored("session", "draft")).toEqual({ wadName: "Sunlust" });
    });

    it("keeps local and session storage apart", () => {
        // when
        writeStored("local", "streaming", true);

        // then
        expect(readStored("session", "streaming")).toBeNull();
    });

    it("forgets what it removed", () => {
        // given
        writeStored("local", "streaming", true);

        // when
        removeStored("local", "streaming");

        // then
        expect(readStored("local", "streaming")).toBeNull();
    });

    it("ignores a stored value it cannot read", () => {
        // given
        localStorage.setItem("streaming", "{not json");

        // then
        expect(readStored("local", "streaming")).toBeNull();
    });
});
