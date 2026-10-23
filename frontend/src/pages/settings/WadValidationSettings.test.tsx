import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { useWadValidationForm } from "../../hooks/useWadValidationForm";
import { renderWithProviders } from "../../test-utils/render";
import { WadValidationSettings } from "./WadValidationSettings";

const mocks = vi.hoisted(() => ({
    useWadValidationForm: vi.fn(),
    addRow: vi.fn(),
    removeRow: vi.fn(),
    updateRow: vi.fn(),
    toggleZip: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
}));

vi.mock("../../hooks/useWadValidationForm", () => ({ useWadValidationForm: mocks.useWadValidationForm }));

type WadValidationForm = ReturnType<typeof useWadValidationForm>;

const ZIP_HEADER = "PK\u0003\u0004";

function makeRows(): NonNullable<WadValidationForm["rows"]> {
    return {
        files: [
            { extension: "WAD", header: "PWAD", zip: false },
            { extension: "DEH", header: "", zip: false },
        ],
        zips: [{ extension: "ZIP", header: ZIP_HEADER, zip: true }],
    };
}

function stubForm(overrides: Partial<WadValidationForm> = {}): void {
    const form: WadValidationForm = {
        loading: false,
        loadError: null,
        rows: makeRows(),
        dirty: false,
        error: null,
        saved: false,
        saving: false,
        addRow: mocks.addRow,
        removeRow: mocks.removeRow,
        updateRow: mocks.updateRow,
        toggleZip: mocks.toggleZip,
        save: mocks.save,
        reset: mocks.reset,
        ...overrides,
    };
    mocks.useWadValidationForm.mockReturnValue(form);
}

function section(name: string) {
    return within(screen.getByRole("region", { name }));
}

function valuesIn(name: string, label: string): (string | null)[] {
    return section(name)
        .getAllByLabelText(label)
        .map(input => (input instanceof HTMLInputElement ? input.value : null));
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.save.mockImplementation((event: { preventDefault: () => void }) => event.preventDefault());
    stubForm();
});

describe("WadValidationSettings", () => {
    it("says it is loading while the rules are on their way", () => {
        // given
        stubForm({ loading: true, rows: null });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.getByText("Loading the validation rules...")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save rules" })).not.toBeInTheDocument();
    });

    it("shows why the rules could not be loaded instead of offering an empty list to save", () => {
        // given
        stubForm({ loadError: "Could not load the WAD validation rules.", rows: null });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not load the WAD validation rules.");
        expect(screen.queryByRole("button", { name: "Save rules" })).not.toBeInTheDocument();
    });

    it("lists each section's extensions with their headers", () => {
        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(valuesIn("Files", "Extension")).toEqual(["WAD", "DEH"]);
        expect(valuesIn("Files", "Header")).toEqual(["PWAD", ""]);
        expect(valuesIn("Files inside zips", "Extension")).toEqual(["ZIP"]);
    });

    it("switches on and locks the header of a zip row", () => {
        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        const zips = section("Files inside zips");
        expect(zips.getByRole("switch", { name: "Zip" })).toHaveAttribute("aria-checked", "true");
        expect(zips.getByLabelText("Header")).toBeDisabled();
        expect(zips.getByLabelText("Header")).toHaveValue(ZIP_HEADER);
    });

    it("says any file type is accepted when a section has no extensions", () => {
        // given
        stubForm({ rows: { ...makeRows(), zips: [] } });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(
            section("Files inside zips").getByText("No extensions yet, so any file type is accepted."),
        ).toBeInTheDocument();
    });

    it("passes on an extension as it is typed", () => {
        // given
        renderWithProviders(<WadValidationSettings />);

        // when
        fireEvent.change(section("Files").getAllByLabelText("Extension")[1], { target: { value: "BEX" } });

        // then
        expect(mocks.updateRow).toHaveBeenCalledWith("files", 1, { extension: "BEX" });
    });

    it("passes on a header as it is typed", () => {
        // given
        renderWithProviders(<WadValidationSettings />);

        // when
        fireEvent.change(section("Files").getAllByLabelText("Header")[0], { target: { value: "IWAD" } });

        // then
        expect(mocks.updateRow).toHaveBeenCalledWith("files", 0, { header: "IWAD" });
    });

    it("marks a row as a zip when its switch is turned on", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<WadValidationSettings />);

        // when
        await user.click(section("Files").getAllByRole("switch", { name: "Zip" })[1]);

        // then
        expect(mocks.toggleZip).toHaveBeenCalledWith("files", 1, true);
    });

    it("adds an extension to the section whose button was pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<WadValidationSettings />);

        // when
        await user.click(section("Files inside zips").getByRole("button", { name: "Add extension" }));

        // then
        expect(mocks.addRow).toHaveBeenCalledWith("zips");
    });

    it("removes the row whose remove button was pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<WadValidationSettings />);

        // when
        await user.click(section("Files").getAllByRole("button", { name: "Remove" })[0]);

        // then
        expect(mocks.removeRow).toHaveBeenCalledWith("files", 0);
    });

    it("saves the rules when the button is pressed", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<WadValidationSettings />);

        // when
        await user.click(screen.getByRole("button", { name: "Save rules" }));

        // then
        expect(mocks.save).toHaveBeenCalledOnce();
    });

    it("says there are unsaved changes and lets them be thrown away", async () => {
        // given
        stubForm({ dirty: true });
        const user = userEvent.setup();
        renderWithProviders(<WadValidationSettings />);

        // when
        await user.click(screen.getByRole("button", { name: "Discard" }));

        // then
        expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
        expect(mocks.reset).toHaveBeenCalledOnce();
    });

    it("has nothing to discard before anything changed", () => {
        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
    });

    it("shows why the rules could not be saved", () => {
        // given
        stubForm({ error: "Zip extensions and headers must contain equal entries" });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Zip extensions and headers must contain equal entries");
    });

    it("confirms the rules were saved", () => {
        // given
        stubForm({ saved: true });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.getByRole("status")).toHaveTextContent("Validation rules saved.");
    });

    it("disables saving while the rules are being sent", () => {
        // given
        stubForm({ saving: true });

        // when
        renderWithProviders(<WadValidationSettings />);

        // then
        expect(screen.getByRole("button", { name: "Save rules" })).toBeDisabled();
    });
});
