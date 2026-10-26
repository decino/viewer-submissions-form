import { describe, expect, it } from "vitest";
import { acceptAttribute } from "./upload";

describe("acceptAttribute", () => {
    it("turns the allowed extensions into a file input accept list", () => {
        // then
        expect(acceptAttribute(["WAD", "PK3", "ZIP"])).toBe(".WAD,.PK3,.ZIP");
    });

    it("accepts nothing extra when no extension is allowed", () => {
        // then
        expect(acceptAttribute([])).toBe("");
    });
});
