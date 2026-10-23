import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { providerWrapper } from "../test-utils/render";
import type { AdminSubmission, SuccessResponse } from "../types/api";
import { useEndRoundWizard } from "./useEndRoundWizard";

const mocks = vi.hoisted(() => ({
    pause: vi.fn(),
    build: vi.fn(),
    generate: vi.fn(),
    submit: vi.fn(),
}));

vi.mock("./mutations/round", () => ({
    usePauseRound: () => ({ mutateAsync: mocks.pause, isPending: false }),
    useBuildResultSet: () => ({ mutateAsync: mocks.build, isPending: false }),
    useGenerateEntries: () => ({ mutateAsync: mocks.generate, isPending: false }),
    useSubmitEntries: () => ({ mutateAsync: mocks.submit, isPending: false }),
}));

const ok: SuccessResponse = { success: true, description: "Done" };

function makeSubmission(id: number, overrides: Partial<AdminSubmission> = {}): AdminSubmission {
    return {
        id,
        created: "2026-10-02T18:30:00.000Z",
        updated: "2026-10-02T18:30:00.000Z",
        WADName: `WAD ${id}`,
        level: "MAP01",
        authorName: "doomguy",
        submissionRoundId: 5,
        playOrder: null,
        youtubeLink: null,
        status: null,
        chosen: false,
        recordedFormat: "Practised",
        downloadUrl: null,
        playTestEngine: "dsda-doom",
        WAD: "https://www.doomworld.com/idgames/levels/doom2/megawads/sunlust",
        engine: 11,
        gzDoomAction: null,
        author: false,
        distributable: false,
        info: null,
        customWad: null,
        email: "submitter@example.test",
        submissionValid: true,
        verified: true,
        ...overrides,
    };
}

function setup(paused = true, roundId = 5) {
    const onFinished = vi.fn();
    const { result, unmount } = renderHook(() => useEndRoundWizard(roundId, paused, onFinished), {
        wrapper: providerWrapper(),
    });

    return { result, onFinished, unmount };
}

type WizardResult = ReturnType<typeof setup>["result"];

async function openPicking(result: WizardResult): Promise<void> {
    await act(async () => {
        await result.current.next();
    });
}

async function draw(result: WizardResult, ids: readonly number[]): Promise<void> {
    for (const id of ids) {
        mocks.generate.mockResolvedValueOnce([makeSubmission(id)]);
        await act(async () => {
            await result.current.addRandom();
        });
    }
}

function pickedIds(result: WizardResult): number[] {
    return result.current.picks.map(pick => pick.entry.id);
}

function selectRows(result: WizardResult, positions: readonly number[]): void {
    act(() => {
        result.current.select(new Set(positions.map(position => result.current.picks[position].key)));
    });
}

beforeEach(() => {
    mocks.pause.mockReset().mockResolvedValue(ok);
    mocks.build.mockReset().mockResolvedValue(ok);
    mocks.generate.mockReset().mockResolvedValue([]);
    mocks.submit.mockReset().mockResolvedValue(ok);
});

describe("useEndRoundWizard", () => {
    it("starts on the pause step with nothing picked", () => {
        // when
        const { result } = setup();

        // then
        expect(result.current.step).toBe("pause");
        expect(result.current.picks).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it("blocks moving on while the round is still taking entries", () => {
        // when
        const { result } = setup(false);

        // then
        expect(result.current.nextDisabled).toBe(true);
    });

    it("pauses the round when asked", async () => {
        // given
        const { result } = setup(false);

        // when
        await act(async () => {
            await result.current.pause();
        });

        // then
        expect(mocks.pause).toHaveBeenCalledWith(true);
        expect(result.current.error).toBeNull();
    });

    it("says why the round could not be paused", async () => {
        // given
        mocks.pause.mockRejectedValue(new Error("No round is active"));
        const { result } = setup(false);

        // when
        await act(async () => {
            await result.current.pause();
        });

        // then
        expect(result.current.error).toBe("No round is active");
    });

    it("says plainly that the round could not be paused when the server gives no reason", async () => {
        // given
        mocks.pause.mockRejectedValue(new Error());
        const { result } = setup(false);

        // when
        await act(async () => {
            await result.current.pause();
        });

        // then
        expect(result.current.error).toBe("Could not pause the round.");
    });

    it("builds the result set on the way to picking winners", async () => {
        // given
        const { result } = setup();

        // when
        await openPicking(result);

        // then
        expect(mocks.build).toHaveBeenCalledOnce();
        expect(result.current.step).toBe("pick");
    });

    it("builds the result set only once when the admin goes back and forward again", async () => {
        // given
        const { result } = setup();
        await openPicking(result);

        // when
        act(() => {
            result.current.back();
        });
        await openPicking(result);

        // then
        expect(mocks.build).toHaveBeenCalledOnce();
        expect(result.current.step).toBe("pick");
    });

    it("stays on the pause step and says why when the result set cannot be built", async () => {
        // given
        mocks.build.mockRejectedValue(new Error("There are no entries in this round!"));
        const { result } = setup();

        // when
        await openPicking(result);

        // then
        expect(result.current.step).toBe("pause");
        expect(result.current.error).toBe("There are no entries in this round!");
    });

    it("says plainly that the entries could not be prepared when the server gives no reason", async () => {
        // given
        mocks.build.mockRejectedValue(new Error());
        const { result } = setup();

        // when
        await openPicking(result);

        // then
        expect(result.current.step).toBe("pause");
        expect(result.current.error).toBe("Could not prepare the entries to pick from.");
    });

    it("appends a random entry to the picks", async () => {
        // given
        const { result } = setup();
        await openPicking(result);

        // when
        await draw(result, [4, 9]);

        // then
        expect(mocks.generate).toHaveBeenCalledWith(1);
        expect(pickedIds(result)).toEqual([4, 9]);
    });

    it("says so when there is no WAD left to add", async () => {
        // given
        const { result } = setup();
        await openPicking(result);

        // when
        await act(async () => {
            await result.current.addRandom();
        });

        // then
        expect(result.current.picks).toEqual([]);
        expect(result.current.error).toBe("No WADs are left to pick from");
    });

    it("shows the server's message when a random entry cannot be drawn", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        mocks.generate.mockRejectedValue(new Error("Unable to generate entries as the cache has not been built."));

        // when
        await act(async () => {
            await result.current.addRandom();
        });

        // then
        expect(result.current.error).toBe("Unable to generate entries as the cache has not been built.");
    });

    it("says plainly that no entry could be drawn when the server gives no reason", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        mocks.generate.mockRejectedValue(new Error());

        // when
        await act(async () => {
            await result.current.addRandom();
        });

        // then
        expect(result.current.picks).toEqual([]);
        expect(result.current.error).toBe("Could not draw random entries.");
    });

    it("re-rolls the selected rows in place and keeps the others", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [1, 2, 3]);
        selectRows(result, [0, 2]);
        mocks.generate.mockResolvedValueOnce([makeSubmission(7), makeSubmission(8)]);

        // when
        await act(async () => {
            await result.current.rerollSelected();
        });

        // then
        expect(mocks.generate).toHaveBeenLastCalledWith(2);
        expect(pickedIds(result)).toEqual([7, 2, 8]);
        expect(result.current.selected.size).toBe(0);
        expect(result.current.error).toBeNull();
    });

    it("replaces only as many rows as came back and says how few were left", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [1, 2, 3]);
        selectRows(result, [0, 1, 2]);
        mocks.generate.mockResolvedValueOnce([makeSubmission(7)]);

        // when
        await act(async () => {
            await result.current.rerollSelected();
        });

        // then
        expect(pickedIds(result)).toEqual([7, 2, 3]);
        expect(result.current.selected).toEqual(new Set([result.current.picks[1].key, result.current.picks[2].key]));
        expect(result.current.error).toBe("Only 1 WAD is left to pick from");
    });

    it("counts the WADs left in the plural when more than one came back", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [1, 2, 3]);
        selectRows(result, [0, 1, 2]);
        mocks.generate.mockResolvedValueOnce([makeSubmission(7), makeSubmission(8)]);

        // when
        await act(async () => {
            await result.current.rerollSelected();
        });

        // then
        expect(result.current.error).toBe("Only 2 WADs are left to pick from");
    });

    it("removes the selected rows without asking the server", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [1, 2, 3]);
        selectRows(result, [1]);
        mocks.generate.mockClear();

        // when
        act(() => {
            result.current.removeSelected();
        });

        // then
        expect(pickedIds(result)).toEqual([1, 3]);
        expect(result.current.selected.size).toBe(0);
        expect(mocks.generate).not.toHaveBeenCalled();
    });

    it("asks for at least one entry before moving on", async () => {
        // given
        const { result } = setup();

        // when
        await openPicking(result);

        // then
        expect(result.current.blocker).toBe("Pick at least one entry");
        expect(result.current.nextDisabled).toBe(true);
    });

    it("flags duplicate entries and blocks moving on until they are removed", async () => {
        // given
        const { result } = setup();
        await openPicking(result);

        // when
        await draw(result, [1, 5, 5]);

        // then
        expect(result.current.duplicates).toEqual(new Set([5]));
        expect(result.current.blocker).toBe("Remove duplicate entries before continuing");
        expect(result.current.nextDisabled).toBe(true);
    });

    it("lets the admin move on once the duplicate is removed", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [1, 5, 5]);
        selectRows(result, [2]);

        // when
        act(() => {
            result.current.removeSelected();
        });

        // then
        expect(result.current.blocker).toBeNull();
        expect(result.current.nextDisabled).toBe(false);
    });

    it("submits the picks in play order and finishes", async () => {
        // given
        const { result, onFinished } = setup();
        await openPicking(result);
        await draw(result, [4, 2, 7]);
        await act(async () => {
            await result.current.next();
        });

        // when
        await act(async () => {
            await result.current.next();
        });

        // then
        expect(mocks.submit).toHaveBeenCalledWith([4, 2, 7]);
        expect(onFinished).toHaveBeenCalledOnce();
    });

    it("stays on the review and says why when the winners cannot be saved", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error("Entry of ID 4 is not found in current active round."));
        const { result, onFinished } = setup();
        await openPicking(result);
        await draw(result, [4]);
        await act(async () => {
            await result.current.next();
        });

        // when
        await act(async () => {
            await result.current.next();
        });

        // then
        expect(result.current.step).toBe("review");
        expect(result.current.error).toBe("Entry of ID 4 is not found in current active round.");
        expect(onFinished).not.toHaveBeenCalled();
    });

    it("says plainly that the winners could not be saved when the server gives no reason", async () => {
        // given
        mocks.submit.mockRejectedValue(new Error());
        const { result, onFinished } = setup();
        await openPicking(result);
        await draw(result, [4]);
        await act(async () => {
            await result.current.next();
        });

        // when
        await act(async () => {
            await result.current.next();
        });

        // then
        expect(result.current.error).toBe("Could not save the winners.");
        expect(onFinished).not.toHaveBeenCalled();
    });

    it("picks up where it left off for the same round", async () => {
        // given
        const first = setup();
        await openPicking(first.result);
        await draw(first.result, [4, 2]);
        first.unmount();

        // when
        const { result } = setup();
        await draw(result, [7]);

        // then
        expect(result.current.step).toBe("pick");
        expect(pickedIds(result)).toEqual([4, 2, 7]);
        expect(new Set(result.current.picks.map(pick => pick.key)).size).toBe(3);
    });

    it("starts over for a different round", async () => {
        // given
        const first = setup(true, 5);
        await openPicking(first.result);
        await draw(first.result, [4]);
        first.unmount();

        // when
        const { result } = setup(true, 6);

        // then
        expect(result.current.step).toBe("pause");
        expect(result.current.picks).toEqual([]);
    });

    it("forgets the picks once the winners are saved", async () => {
        // given
        const first = setup();
        await openPicking(first.result);
        await draw(first.result, [4]);
        await act(async () => {
            await first.result.current.next();
        });
        await act(async () => {
            await first.result.current.next();
        });
        first.unmount();

        // when
        const { result } = setup();

        // then
        expect(result.current.step).toBe("pause");
        expect(result.current.picks).toEqual([]);
    });

    it("goes back to picking from the review with the picks kept", async () => {
        // given
        const { result } = setup();
        await openPicking(result);
        await draw(result, [4, 2]);
        await act(async () => {
            await result.current.next();
        });

        // when
        act(() => {
            result.current.back();
        });

        // then
        expect(result.current.step).toBe("pick");
        expect(pickedIds(result)).toEqual([4, 2]);
    });
});
