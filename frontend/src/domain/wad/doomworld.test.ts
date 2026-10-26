import { describe, expect, it } from "vitest";
import { extractIdgamesTitle, idgamesUrl } from "./doomworld";

describe("idgamesUrl", () => {
    it("accepts a Doomworld idgames page", () => {
        // then
        expect(idgamesUrl("https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust")).toBe(
            "https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust",
        );
    });

    it("ignores links that are not idgames pages", () => {
        // then
        expect(idgamesUrl("https://www.doomworld.com/forum/")).toBeNull();
        expect(idgamesUrl("https://example.com/idgames/sunlust.zip")).toBeNull();
    });

    it("ignores text that is not a URL", () => {
        // then
        expect(idgamesUrl("sunlust")).toBeNull();
    });
});

describe("extractIdgamesTitle", () => {
    it("reads the title cell of the idgames file list", () => {
        // given
        const html = `<table class="filelist"><tbody><tr><td>Title:</td><td> Sunlust </td></tr></tbody></table>`;

        // then
        expect(extractIdgamesTitle(html)).toBe("Sunlust");
    });

    it("reports no title when the page has no file list", () => {
        // then
        expect(extractIdgamesTitle("<p>not found</p>")).toBeNull();
    });
});
