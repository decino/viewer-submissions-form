import {AfterInit} from "@tsed/common";
import {DataSource, EntityManager} from "typeorm";
import {SubmissionRoundModel} from "../../model/db/SubmissionRound.model";
import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../../model/di/tokens";
import {Logger} from "@tsed/logger";
import {AbstractDao} from "./AbstractDao";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SubmissionRoundDao extends AbstractDao<SubmissionRoundModel> implements AfterInit {

    @Inject()
    private logger: Logger;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    public get dataSource(): DataSource {
        return this.ds;
    }

    public $afterInit(): void {
        this.dao = this.ds.getRepository(SubmissionRoundModel);
    }

    public createRound(model: SubmissionRoundModel, transaction?: EntityManager): Promise<SubmissionRoundModel> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        return manager.save(model);
    }

    public retrieveActiveRound(transaction?: EntityManager): Promise<SubmissionRoundModel | null> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        return manager.findOneBy({
            active: true
        });
    }

    public retrieveRound(roundId: number, transaction?: EntityManager): Promise<SubmissionRoundModel | null> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        return manager.findOneBy({
            id: roundId
        });
    }

    public async deleteRound(round: SubmissionRoundModel, transaction?: EntityManager): Promise<boolean> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        try {
            await manager.remove(round);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }

    public async getAllRounds(includeActive = true, transaction?: EntityManager): Promise<SubmissionRoundModel[]> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        let rounds: SubmissionRoundModel[];
        if (includeActive) {
            rounds = await manager.find();
        } else {
            rounds = await manager.findBy({
                active: true
            });
        }
        return rounds ?? [];
    }

    public saveOrUpdateRounds(models: SubmissionRoundModel | SubmissionRoundModel[], transaction?: EntityManager): Promise<SubmissionRoundModel | SubmissionRoundModel[]> {
        const manager = this.getTransaction(SubmissionRoundModel, transaction);
        if (!Array.isArray(models)) {
            return manager.save(models);
        }
        return manager.save(models);
    }
}