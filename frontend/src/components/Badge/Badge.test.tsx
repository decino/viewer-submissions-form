import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Badge } from "./Badge";

describe("Badge", () => {
    it("renders its children", () => {
        // when
        renderWithProviders(<Badge>Live</Badge>);

        // then
        expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("gives every tone its own styling", () => {
        // given
        const tones = ["danger", "info", "success", "warning", "muted"] as const;

        // when
        renderWithProviders(
            <>
                {tones.map(tone => (
                    <Badge key={tone} tone={tone}>
                        {tone}
                    </Badge>
                ))}
            </>,
        );

        // then
        const seen = new Set<string>();
        for (const tone of tones) {
            seen.add(screen.getByText(tone).className);
        }
        expect(seen.size).toBe(tones.length);
    });

    it("defaults to the muted tone", () => {
        // when
        renderWithProviders(
            <>
                <Badge>default</Badge>
                <Badge tone="muted">explicit</Badge>
            </>,
        );

        // then
        expect(screen.getByText("default").className).toBe(screen.getByText("explicit").className);
    });
});
