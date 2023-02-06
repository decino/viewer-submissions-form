import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {BadRequest} from "@tsed/exceptions";
import {SubmissionModel} from "../model/db/Submission.model";

@Service()
export class SubmissionRoundService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private customWadEngine: CustomWadEngine;

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

    public async getAllSubmissionRounds(includeActive = true): Promise<SubmissionRoundModel[]> {
        const repo = this.ds.getRepository(SubmissionRoundModel);
        if (includeActive) {
            return (await repo.find({
                relations: ["submissions"]
            })) ?? [];
        }
        const foundWithoutActive = await repo.find({
            where: {
                active: false
            },
            relations: ["submissions"]
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
