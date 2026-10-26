import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
    it("announces the message it is given", () => {
        // given
        const message = "Incorrect email/password";

        // when
        renderWithProviders(<ErrorBanner message={message} />);

        // then
        expect(screen.getByRole("alert")).toHaveTextContent(message);
    });

    it("renders nothing at all while there is no error", () => {
        // given
        const message = null;

        // when
        const { container } = renderWithProviders(<ErrorBanner message={message} />);

        // then
        expect(container).toBeEmptyDOMElement();
    });

    it("replaces the message when a new failure arrives", () => {
        // given
        const { rerender } = renderWithProviders(<ErrorBanner message="Incorrect email/password" />);

        // when
        rerender(<ErrorBanner message="The round has ended" />);

        // then
        expect(screen.getByText("The round has ended")).toBeInTheDocument();
        expect(screen.queryByText("Incorrect email/password")).not.toBeInTheDocument();
    });

    it("disappears once the error is cleared", () => {
        // given
        const { rerender } = renderWithProviders(<ErrorBanner message="Incorrect email/password" />);

        // when
        rerender(<ErrorBanner message={null} />);

        // then
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("still renders its container when the message is empty", () => {
        // given
        const message = "";

        // when
        const { container } = renderWithProviders(<ErrorBanner message={message} />);

        // then
        expect(container.firstElementChild).not.toBeNull();
        expect(container).toHaveTextContent("");
    });
});
