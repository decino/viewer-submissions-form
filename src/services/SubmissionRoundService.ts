import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {BadRequest} from "@tsed/exceptions";

@Service()
export class SubmissionRoundService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private customWadEngine: CustomWadEngine;

    public newSubmissionRound(): Promise<SubmissionRoundModel> {
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
                active: true
            });
            return repo.save(newModel);
        });
    }

    public async getCurrentActiveSubmissionRound(): Promise<SubmissionRoundModel | null> {
        const found = await this.ds.manager.findOne(SubmissionRoundModel, {
            where: {
                active: true
            },
            relations: ["submissions"]
        });
        if (!found) {
            return null;
        }
        found.submissions = found.submissions.filter(submission => submission.submissionValid);
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

    public async endActiveSubmissionRound(): Promise<boolean> {
        const repo = this.ds.getRepository(SubmissionRoundModel);
        const currentlyActive = await repo.findOne({
            where: {
                active: true
            }
        });
        if (currentlyActive) {
            currentlyActive.active = false;
            await repo.save(currentlyActive);
            return true;
        }
        return false;
    }

    public async pauseRound(pause: boolean): Promise<void> {
        const currentActiveRound = await this.getCurrentActiveSubmissionRound();
        if (!currentActiveRound) {
            throw new BadRequest("No active round to pause");
        }
        const repo = this.ds.getRepository(SubmissionRoundModel);
        currentActiveRound.paused = pause;
        await repo.save(currentActiveRound);
    }
}
