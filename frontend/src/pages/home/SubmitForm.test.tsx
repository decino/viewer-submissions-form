import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../components/Button/Button";
import { emptyDraft, type SubmissionDraft } from "../../domain/submission/formData";
import type { useSubmitForm } from "../../hooks/useSubmitForm";
import { renderWithProviders } from "../../test-utils/render";
import { SubmitForm } from "./SubmitForm";

type SubmitFormState = ReturnType<typeof useSubmitForm>;

const mocks = vi.hoisted(() => ({
    useSubmitForm: vi.fn(),
}));

vi.mock("../../hooks/useSubmitForm", () => ({ useSubmitForm: mocks.useSubmitForm }));
vi.mock("../../components/Captcha/Captcha", () => ({
    Captcha: ({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: number }) => (
        <Button type="button" onClick={() => onToken("turnstile-token")}>
            Captcha {resetKey}
        </Button>
    ),
}));
vi.mock("../../components/PrivacyPolicy/PrivacyPolicy", () => ({
    PrivacyPolicy: () => <p>The privacy policy</p>,
}));

const GZ_QUESTION = "If GZDoom/UZDoom is required, am I allowed to jump, crouch or mouse-look?";
const SHARE_QUESTION = "If you made it and it isn't hosted publicly, may I share it with viewers?";

function draftWith(changes: Partial<SubmissionDraft>): SubmissionDraft {
    return { ...emptyDraft(), ...changes };
}

function stubForm(overrides: Partial<SubmitFormState> = {}): SubmitFormState {
    const form: SubmitFormState = {
        draft: emptyDraft(),
        update: vi.fn(),
        toggleGzAction: vi.fn(),
        chooseMode: vi.fn(),
        changeWadUrl: vi.fn(),
        lookUpWadName: vi.fn(),
        chooseFile: vi.fn(),
        fileInput: vi.fn(),
        wadNameField: { value: "", readOnly: false, placeholder: undefined },
        upload: { accept: ".wad,.zip,.pk3", limitMb: 2, error: null },
        fileError: null,
        mapNames: [],
        mapError: null,
        captcha: { resetKey: 0, onToken: vi.fn(), error: null },
        error: null,
        sending: false,
        canSubmit: true,
        submitted: false,
        submit: vi.fn(async (event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();
        }),
        reset: vi.fn(),
        ...overrides,
    };
    mocks.useSubmitForm.mockReturnValue(form);

    return form;
}

function makeFile(name: string): File {
    return new File(["PWAD"], name);
}

beforeEach(() => {
    stubForm();
});

describe("SubmitForm link or upload", () => {
    it("asks for a download link by default", () => {
        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("radio", { name: "Link" })).toBeChecked();
        expect(screen.getByRole("textbox", { name: "WAD download URL" })).toBeRequired();
        expect(screen.queryByLabelText("WAD file")).not.toBeInTheDocument();
    });

    it("switches to uploading when the visitor picks upload", async () => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("radio", { name: "Upload" }));

        // then
        expect(form.chooseMode).toHaveBeenCalledWith("upload");
    });

    it("hands the typed link to the form and looks up the WAD name once the visitor moves on", async () => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.type(screen.getByRole("textbox", { name: "WAD download URL" }), "h");
        await user.tab();

        // then
        expect(form.changeWadUrl).toHaveBeenCalledWith("h");
        expect(form.lookUpWadName).toHaveBeenCalledOnce();
    });

    it("offers a file picker limited to the allowed types and says how large a file may be", () => {
        // given
        stubForm({ draft: draftWith({ mode: "upload" }) });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("radio", { name: "Upload" })).toBeChecked();
        expect(screen.getByLabelText("WAD file")).toHaveAttribute("accept", ".wad,.zip,.pk3");
        expect(screen.getByLabelText("WAD file")).toBeRequired();
        expect(screen.getByText("Uploads are limited to 2 MB")).toBeInTheDocument();
        expect(screen.queryByRole("textbox", { name: "WAD download URL" })).not.toBeInTheDocument();
    });

    it("hands the chosen file to the form", async () => {
        // given
        const form = stubForm({ draft: draftWith({ mode: "upload" }) });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.upload(screen.getByLabelText("WAD file"), makeFile("sunlust.wad"));

        // then
        expect(form.chooseFile).toHaveBeenCalledOnce();
    });

    it("says why the chosen file was turned away", () => {
        // given
        stubForm({ draft: draftWith({ mode: "upload" }), fileError: "That file is larger than 2 MB" });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("That file is larger than 2 MB");
    });

    it("says why the upload settings could not be loaded", () => {
        // given
        stubForm({
            draft: draftWith({ mode: "upload" }),
            upload: { accept: undefined, limitMb: null, error: "Could not load the upload settings." },
        });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the upload settings.");
        expect(screen.queryByText(/Uploads are limited to/)).not.toBeInTheDocument();
    });
});

describe("SubmitForm WAD name and level", () => {
    it("shows the WAD name the form holds and keeps it locked when told to", () => {
        // given
        stubForm({ wadNameField: { value: "Sunlust", readOnly: true, placeholder: undefined } });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        const wadName = screen.getByRole("textbox", { name: "WAD name" });
        expect(wadName).toHaveValue("Sunlust");
        expect(wadName).toHaveAttribute("readonly");
    });

    it("says it is looking up the WAD name while the lookup runs", () => {
        // given
        stubForm({ wadNameField: { value: "", readOnly: true, placeholder: "Looking up the WAD name..." } });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("textbox", { name: "WAD name" })).toHaveAttribute(
            "placeholder",
            "Looking up the WAD name...",
        );
    });

    it("offers the maps of the chosen WAD as the levels to choose from", () => {
        // given
        stubForm({
            draft: draftWith({ mode: "upload", level: "MAP02: Underhalls" }),
            mapNames: ["MAP01: Entryway", "MAP02: Underhalls"],
        });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        const level = screen.getByRole("combobox", { name: "Which level should I play?" });
        expect(
            within(level)
                .getAllByRole("option")
                .map(option => option.textContent),
        ).toEqual(["MAP01: Entryway", "MAP02: Underhalls"]);
        expect(level).toHaveValue("MAP02: Underhalls");
    });

    it("hands the map picked from the WAD to the form", async () => {
        // given
        const form = stubForm({
            draft: draftWith({ mode: "upload", level: "MAP02: Underhalls" }),
            mapNames: ["MAP01: Entryway", "MAP02: Underhalls"],
        });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.selectOptions(
            screen.getByRole("combobox", { name: "Which level should I play?" }),
            "MAP01: Entryway",
        );

        // then
        expect(form.update).toHaveBeenCalledWith("level", "MAP01: Entryway");
    });

    it("asks for the level to be typed and says why when the maps could not be read", () => {
        // given
        stubForm({ draft: draftWith({ mode: "upload" }), mapError: "Not a valid WAD file" });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("textbox", { name: "Which level should I play?" })).toBeInTheDocument();
        expect(
            screen.getByText("The maps in that file could not be read (Not a valid WAD file). Type the level instead."),
        ).toBeInTheDocument();
    });
});

describe("SubmitForm answers", () => {
    it.each([
        ["WAD name", "wadName"],
        ["Which level should I play?", "level"],
        ["Source port you played or tested it on", "playTestEngine"],
        ["Your name", "authorName"],
        ["Tell me something about the level", "info"],
        ["Your email address (kept private)", "email"],
    ])("hands what is typed into %s to the form", async (label, key) => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.type(screen.getByRole("textbox", { name: label }), "x");

        // then
        expect(form.update).toHaveBeenCalledWith(key, "x");
    });

    it("leaves out the GZDoom/UZDoom actions while the map does not need GZDoom/UZDoom", () => {
        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("combobox", { name: "Map compatibility" })).toHaveValue("0");
        expect(screen.queryByRole("group", { name: GZ_QUESTION })).not.toBeInTheDocument();
    });

    it("hands the chosen map compatibility to the form", async () => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.selectOptions(screen.getByRole("combobox", { name: "Map compatibility" }), "GZDoom/UZDoom");

        // then
        expect(form.update).toHaveBeenCalledWith("engine", -1);
    });

    it("asks which GZDoom/UZDoom actions are allowed once the map needs GZDoom/UZDoom", () => {
        // given
        stubForm({ draft: draftWith({ engine: -1, gzDoomActions: [1] }) });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        const actions = within(screen.getByRole("group", { name: GZ_QUESTION })).getAllByRole("switch");
        expect(actions.map(action => action.getAttribute("aria-label"))).toEqual(["Jump", "Crouch", "Mouse look"]);
        expect(screen.getByRole("switch", { name: "Crouch" })).toBeChecked();
        expect(screen.getByRole("switch", { name: "Jump" })).not.toBeChecked();
    });

    it("hands an allowed GZDoom/UZDoom action to the form", async () => {
        // given
        const form = stubForm({ draft: draftWith({ engine: -1 }) });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("switch", { name: "Jump" }));

        // then
        expect(form.toggleGzAction).toHaveBeenCalledWith(0, true);
    });

    it("assumes the submitter did not make the map and so does not ask about sharing it", () => {
        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        const author = within(screen.getByRole("group", { name: "Did you make this level?" }));
        expect(author.getByRole("radio", { name: "No" })).toBeChecked();
        expect(screen.queryByRole("group", { name: SHARE_QUESTION })).not.toBeInTheDocument();
    });

    it("hands the answer to whether the submitter made the map to the form", async () => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);
        const author = within(screen.getByRole("group", { name: "Did you make this level?" }));

        // when
        await user.click(author.getByRole("radio", { name: "Yes" }));

        // then
        expect(form.update).toHaveBeenCalledWith("author", true);
    });

    it("asks whether the map may be shared once the submitter says they made it", async () => {
        // given
        const form = stubForm({ draft: draftWith({ author: true }) });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);
        const share = within(screen.getByRole("group", { name: SHARE_QUESTION }));

        // when
        await user.click(share.getByRole("radio", { name: "Yes" }));

        // then
        expect(form.update).toHaveBeenCalledWith("distributable", true);
    });

    it("asks for a practised recording by default", () => {
        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        const format = within(screen.getByRole("group", { name: "Which recording format would you like?" }));
        expect(format.getByRole("radio", { name: "Practised" })).toBeChecked();
        expect(format.getByRole("radio", { name: "Blind" })).not.toBeChecked();
    });

    it("hands another recording format to the form", async () => {
        // given
        const form = stubForm();
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);
        const format = within(screen.getByRole("group", { name: "Which recording format would you like?" }));

        // when
        await user.click(format.getByRole("radio", { name: "Blind" }));

        // then
        expect(form.update).toHaveBeenCalledWith("recordedFormat", "Blind");
    });
});

describe("SubmitForm captcha and privacy policy", () => {
    it("hands the captcha's token to the form and restarts the captcha when the form says so", async () => {
        // given
        const form = stubForm({ captcha: { resetKey: 2, onToken: vi.fn(), error: null } });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("button", { name: "Captcha 2" }));

        // then
        expect(form.captcha.onToken).toHaveBeenCalledWith("turnstile-token");
    });

    it("says why the captcha settings could not be loaded", () => {
        // given
        stubForm({ captcha: { resetKey: 0, onToken: vi.fn(), error: "Could not load the captcha settings." } });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the captcha settings.");
    });

    it("opens the privacy policy without leaving the form", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("button", { name: "Privacy Policy" }));

        // then
        const policy = within(screen.getByRole("dialog", { name: "Privacy Policy" }));
        expect(policy.getByText("The privacy policy")).toBeInTheDocument();
        expect(screen.getByRole("form", { name: "Submit a WAD" })).toBeInTheDocument();
    });
});

describe("SubmitForm sending", () => {
    it("hands the entry to the form when the visitor sends it", async () => {
        // given
        const form = stubForm({
            draft: draftWith({
                wadUrl: "https://example.com/sunlust.zip",
                level: "MAP12",
                playTestEngine: "dsda-doom",
                email: "player@example.com",
            }),
            wadNameField: { value: "Sunlust", readOnly: false, placeholder: undefined },
        });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("button", { name: "Submit WAD" }));

        // then
        expect(form.submit).toHaveBeenCalledOnce();
    });

    it("tells the visitor to check their email once the entry is sent", () => {
        // given
        stubForm({ submitted: true });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("status")).toHaveTextContent(
            "Check your email. Click the link we sent to confirm your entry; it expires in 20 minutes.",
        );
        expect(screen.queryByRole("form", { name: "Submit a WAD" })).not.toBeInTheDocument();
    });

    it("starts a fresh entry when the visitor asks to submit another", async () => {
        // given
        const form = stubForm({ submitted: true });
        const user = userEvent.setup();
        renderWithProviders(<SubmitForm paused={false} />);

        // when
        await user.click(screen.getByRole("button", { name: "Submit another" }));

        // then
        expect(form.reset).toHaveBeenCalledOnce();
    });

    it("shows why the entry was refused and keeps the form", () => {
        // given
        stubForm({ error: "This WAD has already been submitted" });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("This WAD has already been submitted");
        expect(screen.getByRole("form", { name: "Submit a WAD" })).toBeInTheDocument();
    });

    it("keeps the submit button disabled while the entry is on its way", () => {
        // given
        stubForm({ sending: true, canSubmit: false });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });

    it("holds back the submit button while the form is not ready to send", () => {
        // given
        stubForm({ canSubmit: false });

        // when
        renderWithProviders(<SubmitForm paused={false} />);

        // then
        expect(screen.getByRole("button", { name: "Submit WAD" })).toBeDisabled();
    });

    it("covers the form and offers no way to send it while submissions are paused", () => {
        // when
        renderWithProviders(<SubmitForm paused />);

        // then
        expect(screen.getByText("Submissions are paused")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Submit WAD" })).not.toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "WAD download URL" })).toBeDisabled();
        expect(screen.getByRole("radio", { name: "Upload" })).toBeDisabled();
    });
});
