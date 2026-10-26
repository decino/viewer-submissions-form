import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { RootErrorBoundary } from "./RootErrorBoundary";

const crash = vi.hoisted(() => ({ throwing: true }));

function Fragile() {
    if (crash.throwing) {
        throw new Error("the imp ate the props");
    }
    return <p>back on its feet</p>;
}

describe("RootErrorBoundary", () => {
    it("renders its children while nothing has thrown", () => {
        // when
        renderWithProviders(
            <RootErrorBoundary>
                <p>all quiet</p>
            </RootErrorBoundary>,
        );

        // then
        expect(screen.getByText("all quiet")).toBeInTheDocument();
    });

    it("shows what broke instead of a blank page", () => {
        // given
        crash.throwing = true;
        vi.spyOn(console, "error").mockImplementation(() => {});

        // when
        renderWithProviders(
            <RootErrorBoundary>
                <Fragile />
            </RootErrorBoundary>,
        );

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("This page crashed");
        expect(screen.getByText("Error: the imp ate the props")).toBeInTheDocument();
    });

    it("draws the children again when the visitor tries again", async () => {
        // given
        crash.throwing = true;
        vi.spyOn(console, "error").mockImplementation(() => {});
        const user = userEvent.setup();
        renderWithProviders(
            <RootErrorBoundary>
                <Fragile />
            </RootErrorBoundary>,
        );
        crash.throwing = false;

        // when
        await user.click(screen.getByRole("button", { name: "Try again" }));

        // then
        expect(screen.getByText("back on its feet")).toBeInTheDocument();
    });
});
