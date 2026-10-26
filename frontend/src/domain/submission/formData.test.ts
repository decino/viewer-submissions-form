import { describe, expect, it } from "vitest";
import { buildSubmissionFormData, emptyDraft, type SubmissionDraft } from "./formData";
import { UZDOOM_ENGINE } from "./labels";

function makeDraft(overrides: Partial<SubmissionDraft> = {}): SubmissionDraft {
    return {
        ...emptyDraft(),
        wadUrl: "https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust",
        wadName: "Sunlust",
        level: "MAP01",
        playTestEngine: "DSDA-Doom",
        engine: 11,
        email: "player@example.com",
        ...overrides,
    };
}

describe("emptyDraft", () => {
    it("starts on a link with no engine, Practised and not made by the submitter", () => {
        // then
        expect(emptyDraft()).toEqual({
            mode: "url",
            wadUrl: "",
            wadName: "",
            level: "",
            playTestEngine: "",
            engine: 0,
            gzDoomActions: [],
            authorName: "",
            author: false,
            distributable: false,
            info: "",
            email: "",
            recordedFormat: "Practised",
        });
    });

    it("hands out a fresh draft each time", () => {
        // given
        const first = emptyDraft();

        // when
        first.gzDoomActions.push(1);

        // then
        expect(emptyDraft().gzDoomActions).toEqual([]);
    });
});

describe("buildSubmissionFormData", () => {
    it("sends the fields the submission endpoint reads", () => {
        // given
        const draft = makeDraft({ recordedFormat: "Blind" });

        // when
        const formData = buildSubmissionFormData(draft, null, null);

        // then
        expect(formData.get("WADName")).toBe("Sunlust");
        expect(formData.get("level")).toBe("MAP01");
        expect(formData.get("playTestEngine")).toBe("DSDA-Doom");
        expect(formData.get("engine")).toBe("11");
        expect(formData.get("email")).toBe("player@example.com");
        expect(formData.get("recordedFormat")).toBe("Blind");
    });

    it("sends the WAD link and no file in link mode", () => {
        // given
        const file = new File(["PWAD"], "sunlust.wad");

        // when
        const formData = buildSubmissionFormData(makeDraft({ mode: "url" }), file, null);

        // then
        expect(formData.get("WAD")).toBe("https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust");
        expect(formData.has("file")).toBe(false);
    });

    it("sends the file and no WAD link in upload mode", () => {
        // given
        const file = new File(["PWAD"], "sunlust.wad");

        // when
        const formData = buildSubmissionFormData(makeDraft({ mode: "upload" }), file, null);

        // then
        expect(formData.get("file")).toHaveProperty("name", "sunlust.wad");
        expect(formData.has("WAD")).toBe(false);
    });

    it("sends one gzDoomAction[] entry per allowed action when GZDoom/UZDoom is required", () => {
        // given
        const draft = makeDraft({ engine: UZDOOM_ENGINE, gzDoomActions: [0, 2] });

        // when
        const formData = buildSubmissionFormData(draft, null, null);

        // then
        expect(formData.getAll("gzDoomAction[]")).toEqual(["0", "2"]);
    });

    it("drops the GZDoom/UZDoom actions for any other engine", () => {
        // given
        const draft = makeDraft({ engine: 2, gzDoomActions: [0, 2] });

        // when
        const formData = buildSubmissionFormData(draft, null, null);

        // then
        expect(formData.has("gzDoomAction[]")).toBe(false);
    });

    it("sends the submitter name and the level info when they are filled in", () => {
        // given
        const draft = makeDraft({ authorName: "Ray", info: "My first map" });

        // when
        const formData = buildSubmissionFormData(draft, null, null);

        // then
        expect(formData.get("authorName")).toBe("Ray");
        expect(formData.get("info")).toBe("My first map");
    });

    it("leaves out a blank submitter name and blank level info", () => {
        // given
        const draft = makeDraft({ authorName: "   ", info: "  " });

        // when
        const formData = buildSubmissionFormData(draft, null, null);

        // then
        expect(formData.has("authorName")).toBe(false);
        expect(formData.has("info")).toBe(false);
    });

    it("asks about distribution only when the submitter made the map", () => {
        // given
        const author = makeDraft({ author: true, distributable: true });
        const notAuthor = makeDraft({ author: false, distributable: true });

        // when
        const authorForm = buildSubmissionFormData(author, null, null);
        const notAuthorForm = buildSubmissionFormData(notAuthor, null, null);

        // then
        expect(authorForm.get("author")).toBe("true");
        expect(authorForm.get("distributable")).toBe("true");
        expect(notAuthorForm.get("author")).toBe("false");
        expect(notAuthorForm.has("distributable")).toBe(false);
    });

    it("sends the captcha token when there is one", () => {
        // when
        const formData = buildSubmissionFormData(makeDraft(), null, "turnstile-token");

        // then
        expect(formData.get("cf-turnstile-response")).toBe("turnstile-token");
    });

    it("leaves out the captcha field when there is no token", () => {
        // when
        const formData = buildSubmissionFormData(makeDraft(), null, null);

        // then
        expect(formData.has("cf-turnstile-response")).toBe(false);
    });
});
