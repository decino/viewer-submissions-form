import {Inject, OnInit, Service} from "@tsed/di";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {BadRequest} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {DecinoRoundHistoryImporterEngine} from "../engine/DecinoRoundHistoryImporterEngine";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import {SubmissionStatusModel} from "../model/db/SubmissionStatus.model";
import STATUS from "../model/constants/STATUS";
import {Logger} from "@tsed/logger";
import {SubmissionRoundRepo} from "../db/repo/SubmissionRoundRepo";
import {Builder} from "builder-pattern";

@Service()
export class SubmissionRoundService implements OnInit {

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private decinoRoundHistoryImporterEngine: DecinoRoundHistoryImporterEngine;

    @Inject()
    private logger: Logger;

    @Inject()
    private submissionRoundRepo: SubmissionRoundRepo;

    public async $onInit(): Promise<void> {
        const allRounds = await this.getAllSubmissionRounds(true);
        if (allRounds.length === 0) {
            this.logger.info("First start detected, loading all previous submission rounds from decino.nl...");
            const result = await this.syncRound();
            this.logger.info(`Added ${result.length} submission rounds to the database`);
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
        }
        return this.submissionRoundRepo.createRound(name, endateObj);
    }

    public async syncRound(): Promise<SubmissionRoundModel[]> {
        const entries = await this.decinoRoundHistoryImporterEngine.getSubmissionRounds();
        const submissionRounds = entries.map(entry => {
            const {submissions, roundId} = entry;
            const submissionsModels: SubmissionModel[] = submissions.map((submission, index) => {
                const submissionModelTemplate: Partial<SubmissionModel> = {
                    submissionRoundId: roundId,
                    youtubeLink: submission.youTubeLink,
                    wadLevel: submission.level,
                    isChosen: submission.chosen,
                    wadName: submission.wad,
                    wadURL: submission.wadDownload,
                    wadEngine: DOOM_ENGINE.GZDoom,
                    submitterEmail: `foo@example${index}.com`,
                    submitterName: submission.submitter,
                    submissionValid: true,
                    verified: true
                };
                if (submission.chosen) {
                    const status = Builder(SubmissionStatusModel)
                        .status(STATUS.COMPLETED)
                        .build();
                    submissionModelTemplate.playOrder = submission.no;
                    submissionModelTemplate.status = status;
                }
                return Builder(SubmissionModel, submissionModelTemplate).build();
            });
            let date: Date;
            // UTC time is 0 based so months need -1
            switch (roundId) {
                case 1:
                    date = new Date(Date.UTC(2019, 7 - 1, 1, 18));
                    break;
                case 2:
                    date = new Date(Date.UTC(2020, 9 - 1, 1, 18));
                    break;
                case 3:
                    date = new Date(Date.UTC(2021, 5 - 1, 1));
                    break;
                case 4:
                    date = new Date(Date.UTC(2021, 11 - 1, 1));
                    break;
                case 5:
                    date = new Date(Date.UTC(2022, 12 - 1, 1));
                    break;
                default:
                    date = new Date();
            }
            return Builder(SubmissionRoundModel, {
                id: roundId,
                active: false,
                submissions: submissionsModels,
                name: `Round #0${roundId}`,
                createdAt: date
            }).build();
        });
        return this.submissionRoundRepo.saveOrUpdateRounds(submissionRounds);
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
        try {
            await Promise.all(pArr);
        } catch (e) {
            throw e;
        }
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

}
