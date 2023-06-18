import {Inject, OnInit, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {BadRequest} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";
import {DecinoRoundHistoryImporterEngine} from "../engine/DecinoRoundHistoryImporterEngine";
import DOOM_ENGINE from "../model/constants/DoomEngine";
import {SubmissionStatusModel} from "../model/db/SubmissionStatus.model";
import STATUS from "../model/constants/STATUS";
import {Logger} from "@tsed/logger";

@Service()
export class SubmissionRoundService implements OnInit {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private decinoRoundHistoryImporterEngine: DecinoRoundHistoryImporterEngine;

    @Inject()
    private logger: Logger;

    public async $onInit(): Promise<void> {
        const allRounds = await this.getAllSubmissionRounds(true);
        if (allRounds.length === 0) {
            this.logger.info("First start detected, loading all previous submission rounds from decino.nl...");
            const result = await this.syncRound();
            this.logger.info(`Added ${result.length} submission rounds to the database`);
        }
    }

    public newSubmissionRound(name: string): Promise<SubmissionRoundModel> {
        return this.ds.transaction(async entityManager => {
            const repo = entityManager.getRepository(SubmissionRoundModel);
            const activeRound = await repo.findOne({
                where: {
                    active: true
                }
            });
            if (activeRound) {
                activeRound.active = false;
                await repo.save(activeRound);
            }
            const newModel = entityManager.create(SubmissionRoundModel, {
                active: true,
                name
            });
            return repo.save(newModel);
        });
    }

    public async syncRound(): Promise<SubmissionRoundModel[]> {
        const submissionRoundModelRepository = this.ds.getRepository(SubmissionRoundModel);
        const entries = await this.decinoRoundHistoryImporterEngine.getSubmissionRounds();
        const submissionRounds = entries.map(entry => {
            const {submissions, roundId} = entry;
            const submissionsModels: SubmissionModel[] = submissions.map((submission, index) => {
                const obj: Partial<SubmissionModel> = {
                    submissionRoundId: roundId,
                    youtubeLink: submission.youTubeLink,
                    wadLevel: submission.level,
                    isChosen: submission.chosen,
                    wadName: submission.wad,
                    wadURL: submission.wadDownload,
                    wadEngine: DOOM_ENGINE.GZDoom,
                    submitterEmail: `foo@example${index}.com`,
                    submitterName: submission.submitter,
                    submissionValid: true
                };
                if (submission.chosen) {
                    const status = new SubmissionStatusModel();
                    status.status = STATUS.COMPLETED;
                    obj.playOrder = submission.no;
                    obj.status = status;
                }
                return this.ds.manager.create(SubmissionModel, obj) as SubmissionModel;
            });
            return submissionRoundModelRepository.create({
                id: roundId,
                active: false,
                submissions: submissionsModels,
                name: `Submission${roundId}`
            });
        });
        return submissionRoundModelRepository.save(submissionRounds);
    }

    public async getCurrentActiveSubmissionRound(filterInvalidEntries = true): Promise<SubmissionRoundModel | null> {
        const found = await this.ds.manager.findOne(SubmissionRoundModel, {
            where: {
                active: true
            },
            relations: ["submissions"]
        });
        if (!found) {
            return null;
        }
        if (filterInvalidEntries) {
            found.submissions = found.submissions.filter(submission => submission.submissionValid);
        }
        return found;
    }

    public getSubmissionRound(roundId: number): Promise<SubmissionRoundModel | null> {
        return this.ds.manager.findOne(SubmissionRoundModel, {
            where: {
                id: roundId
            },
            relations: ["submissions", "submissions.status"]
        });
    }

    public async getAllSubmissionRounds(includeActive = true): Promise<SubmissionRoundModel[]> {
        const repo = this.ds.getRepository(SubmissionRoundModel);
        if (includeActive) {
            return (await repo.find({
                relations: ["submissions", "submissions.status"]
            })) ?? [];
        }
        const foundWithoutActive = await repo.find({
            where: {
                active: false
            },
            relations: ["submissions", "submissions.status"]
        });
        return foundWithoutActive ?? [];
    }

    public endActiveSubmissionRound(): Promise<boolean> {
        return this.ds.transaction(async entityManager => {
            const submissionRepo = entityManager.getRepository(SubmissionRoundModel);
            const submissionModelRepository = entityManager.getRepository(SubmissionModel);
            const currentlyActive = await submissionRepo.findOne({
                where: {
                    active: true
                }
            });
            // remove any pending/invalid entries
            const invalidEntries = await submissionModelRepository.find({
                where: {
                    submissionValid: false
                },
                relations: ["confirmation"]
            });
            if (currentlyActive) {
                currentlyActive.active = false;
                await submissionRepo.save(currentlyActive);
                await submissionModelRepository.remove(invalidEntries);
                return true;
            }
            return false;
        });
    }

    public async pauseRound(pause: boolean): Promise<void> {
        const currentActiveRound = await this.getCurrentActiveSubmissionRound(false);
        if (!currentActiveRound) {
            throw new BadRequest("No active round to pause.");
        }
        const repo = this.ds.getRepository(SubmissionRoundModel);
        currentActiveRound.paused = pause;
        await repo.save(currentActiveRound);
    }

}
