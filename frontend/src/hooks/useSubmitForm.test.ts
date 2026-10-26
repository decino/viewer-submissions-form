import { act, renderHook } from "@testing-library/react";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDraft } from "../domain/submission/formData";
import { fileEvent, makeFile } from "../test-utils/fixtures";
import { providerWrapper } from "../test-utils/render";
import type { CaptchaConfig } from "../types/api";
import { useSubmitForm } from "./useSubmitForm";

const mocks = vi.hoisted(() => ({
    useCaptchaConfig: vi.fn(),
    useUploadConfig: vi.fn(),
    useIdgamesTitle: vi.fn(),
    wadMapNames: vi.fn(),
    submit: vi.fn(),
    sending: false,
}));

vi.mock("./queries/site", () => ({
    useCaptchaConfig: mocks.useCaptchaConfig,
    useUploadConfig: mocks.useUploadConfig,
}));

vi.mock("./queries/submission", () => ({ useIdgamesTitle: mocks.useIdgamesTitle }));

vi.mock("./mutations/submission", () => ({
    useSubmitEntry: () => ({ mutateAsync: mocks.submit, isPending: mocks.sending }),
}));

vi.mock("../domain/wad/wad", () => ({
    WadMapAnalyser: {
        create: () =>
            Promise.resolve({
                get mapNames() {
                    return mocks.wadMapNames();
                },
            }),
    },
}));

const IDGAMES_URL = "https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust";

function stubCaptcha(captcha: CaptchaConfig | null, error: string | null = null): void {
    mocks.useCaptchaConfig.mockReturnValue({ captcha, loading: false, error });
}

function stubLookup(title: string | null, loading = false): void {
    mocks.useIdgamesTitle.mockReturnValue({ title, loading });
}

function setup() {
    return renderHook(() => useSubmitForm(), { wrapper: providerWrapper() });
}

function submitEvent(): SubmitEvent<HTMLFormElement> {
    return { preventDefault: vi.fn() } as unknown as SubmitEvent<HTMLFormElement>;
}

function sentForm(): FormData {
    return mocks.submit.mock.calls[0][0] as FormData;
}

beforeEach(() => {
    mocks.sending = false;
    mocks.submit.mockReset();
    mocks.submit.mockResolvedValue({ id: 7 });
    mocks.wadMapNames.mockReset();
    mocks.wadMapNames.mockReturnValue([]);
    mocks.useUploadConfig.mockReturnValue({
        upload: { fileSizeLimitMb: 2, allowedExtensions: ["wad", "zip", "pk3"] },
        loading: false,
        error: null,
    });
    stubCaptcha({ captchaType: null, siteKey: null });
    stubLookup(null);
});

describe("useSubmitForm draft", () => {
    it("starts from an empty draft with nothing chosen and nothing wrong", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.draft).toEqual(emptyDraft());
        expect(result.current.mapNames).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(result.current.submitted).toBe(false);
    });

    it("changes the field it is told to change", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.update("playTestEngine", "dsda-doom"));

        // then
        expect(result.current.draft.playTestEngine).toBe("dsda-doom");
    });

    it("allows and forbids GZDoom actions one at a time, keeping them in order", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.toggleGzAction(2, true));
        act(() => result.current.toggleGzAction(0, true));
        act(() => result.current.toggleGzAction(1, true));
        act(() => result.current.toggleGzAction(2, false));

        // then
        expect(result.current.draft.gzDoomActions).toEqual([0, 1]);
    });

    it("offers the allowed upload types and the size limit from the server", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.upload).toEqual({ accept: ".wad,.zip,.pk3", limitMb: 2, error: null });
    });

    it("passes on why the upload settings could not be loaded", () => {
        // given
        mocks.useUploadConfig.mockReturnValue({
            upload: null,
            loading: false,
            error: "Could not load the upload settings.",
        });

        // when
        const { result } = setup();

        // then
        expect(result.current.upload).toEqual({
            accept: undefined,
            limitMb: null,
            error: "Could not load the upload settings.",
        });
    });

    it("passes on why the captcha settings could not be loaded", () => {
        // given
        stubCaptcha(null, "Could not load the captcha settings.");

        // when
        const { result } = setup();

        // then
        expect(result.current.captcha.error).toBe("Could not load the captcha settings.");
    });
});

describe("useSubmitForm link or upload", () => {
    it("forgets the link when the visitor switches to uploading", () => {
        // given
        const { result } = setup();
        act(() => result.current.changeWadUrl("https://example.com/sunlust.zip"));

        // when
        act(() => result.current.chooseMode("upload"));

        // then
        expect(result.current.draft.mode).toBe("upload");
        expect(result.current.draft.wadUrl).toBe("");
    });

    it("forgets the chosen file, its maps and the picked map when the visitor switches to a link", async () => {
        // given
        mocks.wadMapNames.mockReturnValue(["MAP01: Entryway"]);
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad")).event));

        // when
        act(() => result.current.chooseMode("url"));

        // then
        expect(result.current.mapNames).toEqual([]);
        expect(result.current.draft.level).toBe("");
    });

    it("forgets the map picked from an earlier WAD when another file is chosen", async () => {
        // given
        mocks.wadMapNames.mockReturnValueOnce(["MAP01: Entryway"]);
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad")).event));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.zip")).event));

        // then
        expect(result.current.mapNames).toEqual([]);
        expect(result.current.draft.level).toBe("");
    });

    it("forgets the map picked from an earlier WAD when the next WAD has no maps", async () => {
        // given
        mocks.wadMapNames.mockReturnValueOnce(["MAP01: Entryway"]);
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad")).event));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("scythe.wad")).event));

        // then
        expect(result.current.mapNames).toEqual([]);
        expect(result.current.draft.level).toBe("");
    });

    it("turns away a file larger than the server's upload limit", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad", 2 * 1048576 + 1)).event));

        // then
        expect(result.current.fileError).toBe("That file is larger than 2 MB");
    });

    it("offers the maps of a chosen WAD and picks the first one", async () => {
        // given
        mocks.wadMapNames.mockReturnValue(["MAP01: Entryway", "MAP02: Underhalls"]);
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("SUNLUST.WAD")).event));

        // then
        expect(result.current.mapNames).toEqual(["MAP01: Entryway", "MAP02: Underhalls"]);
        expect(result.current.draft.level).toBe("MAP01: Entryway");
    });

    it("keeps a typed level when the WAD has no maps", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));
        act(() => result.current.update("level", "MAP07"));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad")).event));

        // then
        expect(result.current.draft.level).toBe("MAP07");
    });

    it("passes on why the maps could not be read", async () => {
        // given
        mocks.wadMapNames.mockImplementation(() => {
            throw new Error("Not a valid WAD file");
        });
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));

        // when
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.wad")).event));

        // then
        expect(result.current.mapError).toBe("Not a valid WAD file");
    });
});

describe("useSubmitForm WAD name lookup", () => {
    it("looks up the WAD name once a Doomworld idgames link has been entered", () => {
        // given
        const { result } = setup();
        act(() => result.current.changeWadUrl(IDGAMES_URL));

        // when
        act(() => result.current.lookUpWadName());

        // then
        expect(mocks.useIdgamesTitle).toHaveBeenLastCalledWith(IDGAMES_URL);
    });

    it("does not look up a link that is not on Doomworld's idgames", () => {
        // given
        const { result } = setup();
        act(() => result.current.changeWadUrl("https://example.com/sunlust.zip"));

        // when
        act(() => result.current.lookUpWadName());

        // then
        expect(mocks.useIdgamesTitle).toHaveBeenLastCalledWith(null);
    });

    it("drops the lookup as soon as the link is edited again", () => {
        // given
        const { result } = setup();
        act(() => result.current.changeWadUrl(IDGAMES_URL));
        act(() => result.current.lookUpWadName());

        // when
        act(() => result.current.changeWadUrl(`${IDGAMES_URL}2`));

        // then
        expect(mocks.useIdgamesTitle).toHaveBeenLastCalledWith(null);
    });

    it("fills in and locks the WAD name the lookup found", () => {
        // given
        stubLookup("Sunlust");

        // when
        const { result } = setup();

        // then
        expect(result.current.wadNameField).toEqual({ value: "Sunlust", readOnly: true, placeholder: undefined });
    });

    it("locks the WAD name, says so and holds back the submit while the lookup runs", () => {
        // given
        stubLookup(null, true);

        // when
        const { result } = setup();

        // then
        expect(result.current.wadNameField).toEqual({
            value: "",
            readOnly: true,
            placeholder: "Looking up the WAD name...",
        });
        expect(result.current.canSubmit).toBe(false);
    });

    it("leaves the WAD name editable when the lookup finds nothing", () => {
        // given
        const { result } = setup();

        // when
        act(() => result.current.update("wadName", "Sunlust"));

        // then
        expect(result.current.wadNameField).toEqual({ value: "Sunlust", readOnly: false, placeholder: undefined });
    });
});

describe("useSubmitForm submit", () => {
    it("asks for the captcha first and sends nothing when the captcha is switched on", async () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        const { result } = setup();
        const event = submitEvent();

        // when
        await act(() => result.current.submit(event));

        // then
        expect(event.preventDefault).toHaveBeenCalled();
        expect(result.current.error).toBe("Complete the captcha first");
        expect(mocks.submit).not.toHaveBeenCalled();
    });

    it("sends the draft with the captcha token and reports that it was sent", async () => {
        // given
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        const { result } = setup();
        act(() => result.current.changeWadUrl("https://example.com/sunlust.zip"));
        act(() => result.current.update("wadName", "Sunlust"));
        act(() => result.current.update("level", "MAP12"));
        act(() => result.current.update("email", "player@example.com"));
        act(() => result.current.captcha.onToken("turnstile-token"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        const sent = sentForm();
        expect(sent.get("WAD")).toBe("https://example.com/sunlust.zip");
        expect(sent.get("WADName")).toBe("Sunlust");
        expect(sent.get("level")).toBe("MAP12");
        expect(sent.get("email")).toBe("player@example.com");
        expect(sent.get("cf-turnstile-response")).toBe("turnstile-token");
        expect(result.current.submitted).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("sends the looked up WAD name rather than the typed one", async () => {
        // given
        stubLookup("Sunlust");
        const { result } = setup();
        act(() => result.current.update("wadName", "something I typed"));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(sentForm().get("WADName")).toBe("Sunlust");
    });

    it("sends the chosen file when uploading", async () => {
        // given
        const { result } = setup();
        act(() => result.current.chooseMode("upload"));
        await act(() => result.current.chooseFile(fileEvent(makeFile("sunlust.zip")).event));

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect((sentForm().get("file") as File).name).toBe("sunlust.zip");
        expect(sentForm().has("WAD")).toBe(false);
    });

    it("shows the server's reason when the entry is refused", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error("This WAD has already been submitted"));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("This WAD has already been submitted");
        expect(result.current.submitted).toBe(false);
    });

    it("says the entry could not be sent when the refusal carries no reason", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error(""));
        const { result } = setup();

        // when
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.error).toBe("Your entry could not be sent. Try again.");
    });

    it("starts a fresh captcha after an attempt to send, whatever the outcome", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error("Captcha failed"));
        stubCaptcha({ captchaType: "turnstile", siteKey: "0x4AAA" });
        const { result } = setup();
        act(() => result.current.captcha.onToken("turnstile-token"));

        // when
        await act(() => result.current.submit(submitEvent()));
        await act(() => result.current.submit(submitEvent()));

        // then
        expect(result.current.captcha.resetKey).toBe(1);
        expect(result.current.error).toBe("Complete the captcha first");
        expect(mocks.submit).toHaveBeenCalledOnce();
    });

    it("reports that it is sending and holds back the submit while the request is in flight", () => {
        // given
        mocks.sending = true;

        // when
        const { result } = setup();

        // then
        expect(result.current.sending).toBe(true);
        expect(result.current.canSubmit).toBe(false);
    });

    it("starts over with an empty form when the visitor submits another", async () => {
        // given
        const { result } = setup();
        act(() => result.current.update("wadName", "Sunlust"));
        await act(() => result.current.submit(submitEvent()));

        // when
        act(() => result.current.reset());

        // then
        expect(result.current.submitted).toBe(false);
        expect(result.current.draft).toEqual(emptyDraft());
    });
});

describe("useSubmitForm kept draft", () => {
    it("brings back what was filled in when the visitor comes back to the form", () => {
        // given
        const first = setup();
        act(() => first.result.current.update("wadName", "Sunlust"));
        act(() => first.result.current.update("email", "player@example.com"));
        first.unmount();

        // when
        const { result } = setup();

        // then
        expect(result.current.draft).toEqual({ ...emptyDraft(), wadName: "Sunlust", email: "player@example.com" });
    });

    it("keeps the WAD name the lookup found", () => {
        // given
        stubLookup("Sunlust");
        const first = setup();
        first.unmount();
        stubLookup(null);

        // when
        const { result } = setup();

        // then
        expect(result.current.draft.wadName).toBe("Sunlust");
    });

    it("forgets the draft once the entry has been sent", async () => {
        // given
        const first = setup();
        act(() => first.result.current.update("wadName", "Sunlust"));
        await act(() => first.result.current.submit(submitEvent()));
        first.unmount();

        // when
        const { result } = setup();

        // then
        expect(result.current.draft).toEqual(emptyDraft());
    });

    it("keeps the draft when sending the entry fails", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error("The server is down"));
        const first = setup();
        act(() => first.result.current.update("wadName", "Sunlust"));
        await act(() => first.result.current.submit(submitEvent()));
        first.unmount();

        // when
        const { result } = setup();

        // then
        expect(result.current.draft.wadName).toBe("Sunlust");
    });
});
