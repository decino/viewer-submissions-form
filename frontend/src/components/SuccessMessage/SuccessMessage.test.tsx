import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { SuccessMessage } from "./SuccessMessage";

describe("SuccessMessage", () => {
    it("announces what worked", () => {
        // when
        renderWithProviders(<SuccessMessage>File replaced.</SuccessMessage>);

        // then
        expect(screen.getByRole("status")).toHaveTextContent("File replaced.");
    });
});
