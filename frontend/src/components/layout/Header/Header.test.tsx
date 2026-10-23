import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils/render";
import { Header } from "./Header";

const mocks = vi.hoisted(() => ({
    logout: vi.fn(),
}));

vi.mock("../../../hooks/mutations/auth", () => ({
    useLogout: () => mocks.logout,
}));

describe("Header", () => {
    it("links the site name back to the home page", () => {
        // when
        renderWithProviders(<Header />, { route: "/somewhere" });

        // then
        expect(screen.getByRole("link", { name: /Viewer Submissions/ })).toHaveAttribute("href", "/");
    });

    it("marks this round as the current page on the home page", () => {
        // when
        renderWithProviders(<Header />, { route: "/" });

        // then
        const nav = screen.getByRole("navigation", { name: "Main" });
        expect(nav).toContainElement(screen.getByRole("link", { name: "This round" }));
        expect(screen.getByRole("link", { name: "This round" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "Past rounds" })).not.toHaveAttribute("aria-current");
    });

    it("marks past rounds as the current page on the past rounds page", () => {
        // when
        renderWithProviders(<Header />, { route: "/past-rounds" });

        // then
        expect(screen.getByRole("link", { name: "Past rounds" })).toHaveAttribute("href", "/past-rounds");
        expect(screen.getByRole("link", { name: "Past rounds" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "This round" })).not.toHaveAttribute("aria-current");
    });

    it("keeps the admin inside the admin pages", () => {
        // when
        renderWithProviders(<Header />, { route: "/admin/settings" });

        // then
        expect(screen.getByRole("link", { name: /Viewer Submissions/ })).toHaveAttribute("href", "/admin");
        expect(screen.getByRole("link", { name: "Round" })).toHaveAttribute("href", "/admin");
        expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
        expect(screen.queryByRole("link", { name: "This round" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Past rounds" })).not.toBeInTheDocument();
    });

    it("logs the admin out", async () => {
        // given
        const user = userEvent.setup();
        renderWithProviders(<Header />, { route: "/admin" });

        // when
        await user.click(screen.getByRole("button", { name: "Log out" }));

        // then
        expect(mocks.logout).toHaveBeenCalled();
    });
});
