import { Inject, OnInit, Service } from "@tsed/di";
import { SubmissionRoundModel } from "../model/db/SubmissionRound.model";
import { CustomWadEngine } from "../engine/CustomWadEngine.js";
import { BadRequest } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { SubmissionRoundRepo } from "../db/repo/SubmissionRoundRepo.js";
import { ScheduleService } from "./ScheduleService.js";

@Service()
export class SubmissionRoundService implements OnInit {
    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private logger: Logger;

    @Inject()
    private submissionRoundRepo: SubmissionRoundRepo;

    @Inject()
    private scheduleService: ScheduleService;

    public async $onInit(): Promise<void> {
        const activeRound = await this.getCurrentActiveSubmissionRound();
        if (activeRound) {
            const { endDate } = activeRound;
            if (endDate) {
                this.scheduleDeadline(endDate);
            }
        }
    }

    public getMostSubmittedWadName(roundId?: number): Promise<string | null> {
        return this.submissionRoundRepo.getMostSubmittedWadName(roundId);
    }

    public async newSubmissionRound(name: string, endDate: number | null): Promise<SubmissionRoundModel> {
        const activeRound = await this.submissionRoundRepo.retrieveActiveRound();
        if (activeRound) {
            activeRound.active = false;
            await this.submissionRoundRepo.saveOrUpdateRounds(activeRound);
        }
        let endateObj: Date | null = null;
        if (typeof endDate === "number") {
            endateObj = new Date(endDate);
            if (endateObj.getTime() < Date.now()) {
                throw new BadRequest("Unable to set end date before today");
            }
            endateObj.setHours(23, 59, 59);
        }
        const newRound = await this.submissionRoundRepo.createRound(name, endateObj);
        if (endateObj) {
            this.scheduleDeadline(endateObj);
        }
        return newRound;
    }

    public async getCurrentActiveSubmissionRound(filterInvalidEntries = true): Promise<SubmissionRoundModel | null> {
        const activeRound = await this.submissionRoundRepo.retrieveActiveRound(filterInvalidEntries);
        if (!activeRound) {
            return null;
        }
        return activeRound;
    }

    public getSubmissionRound(roundId: number): Promise<SubmissionRoundModel | null> {
        return this.submissionRoundRepo.retrieveRound(roundId);
    }

    public async deleteRound(roundId: number): Promise<boolean> {
        const existingRound = await this.submissionRoundRepo.retrieveRound(roundId);
        if (!existingRound) {
            throw new BadRequest(`Unable to find round ${roundId}`);
        }
        const pArr: Promise<void>[] = [];
        for (const submission of existingRound.submissions) {
            if (submission.customWadFileName) {
                pArr.push(this.customWadEngine.deleteCustomWad(submission.id, submission.submissionRoundId));
            }
        }
        await Promise.all(pArr);
        return this.submissionRoundRepo.deleteRound(existingRound);
    }

    public getAllSubmissionRounds(includeActive = true): Promise<SubmissionRoundModel[]> {
        return this.submissionRoundRepo.getAllRounds(includeActive);
    }

    public endActiveSubmissionRound(): Promise<boolean> {
        return this.submissionRoundRepo.endActiveRound();
    }

    public pauseRound(pause: boolean): Promise<void> {
        try {
            return this.submissionRoundRepo.pauseRound(pause);
        } catch (e) {
            throw new BadRequest(e.message, e);
        }
    }

    private scheduleDeadline(date: Date): void {
        // ensure that it's the END of the day
        date.setHours(23, 59, 59);
        this.scheduleService.scheduleJobAtDate(
            "submission-deadline-scheduler",
            date,
            async () => {
                this.logger.info("Submission round deadline hit");
                await this.pauseRound(true);
            },
            this,
        );
    }
}
