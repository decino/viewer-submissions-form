import {DataSource, EntityManager} from "typeorm";
import {SubmissionRoundModel} from "../../model/db/SubmissionRound.model";
import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../../model/di/tokens";
import {Logger} from "@tsed/logger";
import {AbstractDao} from "./AbstractDao";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SubmissionRoundDao extends AbstractDao<SubmissionRoundModel> {

    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, SubmissionRoundModel);
    }

    public createRound(model: SubmissionRoundModel, transaction?: EntityManager): Promise<SubmissionRoundModel> {
        const manager = this.getEntityManager(transaction);
        return manager.save(model);
    }

    public retrieveActiveRound(filterInvalidEntries = false, transaction?: EntityManager): Promise<SubmissionRoundModel | null> {
        const manager = this.getEntityManager(transaction);
        if (filterInvalidEntries) {
            return manager.createQueryBuilder("submissionRound")
                .leftJoinAndSelect("submissionRound.submissions", "submission", "submission.submissionValid = true AND submission.verified = true")
                .where("submissionRound.active = true")
                .getOne();
        }
        return manager.findOneBy({
            active: true
        });
    }

    public retrieveRound(roundId: number, transaction?: EntityManager): Promise<SubmissionRoundModel | null> {
        const manager = this.getEntityManager(transaction);
        return manager.findOneBy({
            id: roundId
        });
    }

    public async deleteRound(round: SubmissionRoundModel, transaction?: EntityManager): Promise<boolean> {
        const manager = this.getEntityManager(transaction);
        try {
            await manager.remove(round);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }

    public async getMostSubmittedWadName(roundId?: number, transaction?: EntityManager): Promise<string | null> {
        const entityMan = this.getEntityManager(transaction);
        const submissionModel = await
            entityMan.createQueryBuilder("submissionRound")
                .where("active = true")
                .leftJoinAndSelect("submissionRound.submissions", "submission")
                .groupBy("submission.wadName")
                .orderBy("count(*)", "DESC")
                .limit(1)
                .getOne();
        return submissionModel?.submissions[0]?.wadName ?? null;
    }

    public async getAllRounds(includeActive = true, transaction?: EntityManager): Promise<SubmissionRoundModel[]> {
        const manager = this.getEntityManager(transaction);
        let rounds: SubmissionRoundModel[];
        if (includeActive) {
            rounds = await manager.find();
        } else {
            rounds = await manager.findBy({
                active: false
            });
        }
        return rounds ?? [];
    }

    public saveOrUpdateRounds(models: SubmissionRoundModel | SubmissionRoundModel[], transaction?: EntityManager): Promise<SubmissionRoundModel | SubmissionRoundModel[]> {
        const manager = this.getEntityManager(transaction);
        // @ts-ignore
        return manager.save(models);
    }

    public async setActive(round: SubmissionRoundModel, active: boolean, transaction?: EntityManager): Promise<void> {
        await this.getEntityManager(transaction).update({
            id: round.id
        }, {
            active
        });
    }
}
