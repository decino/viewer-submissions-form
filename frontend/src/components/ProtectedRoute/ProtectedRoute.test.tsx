import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import type { SessionUser } from "../../types/api";
import { ProtectedRoute } from "./ProtectedRoute";

const admin: SessionUser = { id: "1", email: "admin@example.test" };

function renderProtected(user: SessionUser | null, loading = false) {
    return renderWithProviders(
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<p>the admin page</p>} />
            </Route>
            <Route path="/login" element={<p>the login page</p>} />
        </Routes>,
        { route: "/admin", user, auth: { loading } },
    );
}

describe("ProtectedRoute", () => {
    it("shows why the session could not be checked instead of sending the admin to log in again", () => {
        // when
        renderWithProviders(
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<p>the admin page</p>} />
                </Route>
                <Route path="/login" element={<p>the login page</p>} />
            </Routes>,
            { route: "/admin", auth: { error: "Could not check whether you are logged in." } },
        );

        // then
        expect(screen.getByRole("alert")).toHaveTextContent("Could not check whether you are logged in.");
        expect(screen.queryByText("the login page")).not.toBeInTheDocument();
        expect(screen.queryByText("the admin page")).not.toBeInTheDocument();
    });

    it("holds the page with a loading message while the session is still being checked", () => {
        // when
        renderProtected(null, true);

        // then
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(screen.queryByText("the admin page")).not.toBeInTheDocument();
    });

    it("does not send a visitor to the login page before the session has been checked", () => {
        // when
        renderProtected(null, true);

        // then
        expect(screen.queryByText("the login page")).not.toBeInTheDocument();
    });

    it("holds the page even for a signed in admin until the session has been checked", () => {
        // when
        renderProtected(admin, true);

        // then
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(screen.queryByText("the admin page")).not.toBeInTheDocument();
    });

    it("sends a visitor who is not signed in to the login page without showing the admin page", () => {
        // when
        renderProtected(null);

        // then
        expect(screen.getByText("the login page")).toBeInTheDocument();
        expect(screen.queryByText("the admin page")).not.toBeInTheDocument();
    });

    it("shows the admin page to a signed in admin", () => {
        // when
        renderProtected(admin);

        // then
        expect(screen.getByText("the admin page")).toBeInTheDocument();
    });
});
