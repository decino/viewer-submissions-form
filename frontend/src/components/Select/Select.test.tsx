import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Select } from "./Select";

function options() {
    return (
        <>
            <option value="boom">Boom</option>
            <option value="mbf">MBF</option>
            <option value="mbf21">MBF21</option>
        </>
    );
}

describe("Select", () => {
    it("renders every option it is given", () => {
        // given
        const markup = <Select aria-label="Engine">{options()}</Select>;

        // when
        renderWithProviders(markup);

        // then
        const rendered = screen.getAllByRole("option");
        expect(rendered).toHaveLength(3);
        expect(rendered.map(option => option.textContent)).toEqual(["Boom", "MBF", "MBF21"]);
    });

    it("is reachable through the label that points at it", () => {
        // given
        const markup = (
            <>
                <label htmlFor="engine">Map compatibility</label>
                <Select id="engine">{options()}</Select>
            </>
        );

        // when
        renderWithProviders(markup);

        // then
        expect(screen.getByLabelText("Map compatibility")).toBeInstanceOf(HTMLSelectElement);
    });

    it("reports the option that was chosen", async () => {
        // given
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <Select aria-label="Engine" defaultValue="boom" onChange={onChange}>
                {options()}
            </Select>,
        );

        // when
        await user.selectOptions(screen.getByRole("combobox", { name: "Engine" }), "mbf21");

        // then
        expect(onChange).toHaveBeenCalledOnce();
        expect(screen.getByRole("combobox", { name: "Engine" })).toHaveValue("mbf21");
    });

    it("shows the value it is controlled with as the current selection", () => {
        // given
        const onChange = vi.fn();

        // when
        renderWithProviders(
            <Select aria-label="Engine" value="mbf" onChange={onChange}>
                {options()}
            </Select>,
        );

        // then
        expect(screen.getByRole("combobox", { name: "Engine" })).toHaveValue("mbf");
        expect(screen.getByRole<HTMLOptionElement>("option", { name: "MBF" }).selected).toBe(true);
    });

    it("cannot be changed while it is disabled", () => {
        // given
        const onChange = vi.fn();

        // when
        renderWithProviders(
            <Select aria-label="Engine" disabled defaultValue="boom" onChange={onChange}>
                {options()}
            </Select>,
        );

        // then
        expect(screen.getByRole("combobox", { name: "Engine" })).toBeDisabled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("forwards native attributes to the underlying select", () => {
        // given
        const markup = (
            <Select aria-label="Engine" name="engine" required>
                {options()}
            </Select>
        );

        // when
        renderWithProviders(markup);

        // then
        const select = screen.getByRole("combobox", { name: "Engine" });
        expect(select).toHaveAttribute("name", "engine");
        expect(select).toBeRequired();
    });
});
