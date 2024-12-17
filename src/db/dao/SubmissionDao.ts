import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { AbstractDao } from "./AbstractDao.js";
import { SubmissionModel } from "../../model/db/Submission.model.js";
import { Logger } from "@tsed/logger";
import { SQLITE_DATA_SOURCE } from "../../model/di/tokens.js";
import { DataSource, EntityManager, In, LessThanOrEqual } from "typeorm";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SubmissionDao extends AbstractDao<SubmissionModel> {
    @Inject()
    private logger: Logger;

    public constructor(@Inject(SQLITE_DATA_SOURCE) ds: DataSource) {
        super(ds, SubmissionModel);
    }

    public saveOrUpdateSubmission(entry: SubmissionModel, transaction?: EntityManager): Promise<SubmissionModel> {
        return this.getEntityManager(transaction).save(entry);
    }

    public saveOrUpdateSubmissions(
        entries: SubmissionModel[],
        transaction?: EntityManager,
    ): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).save(entries);
    }

    public getSubmission(id: number, transaction?: EntityManager): Promise<SubmissionModel | null> {
        return this.getEntityManager(transaction).findOne({
            relations: ["confirmation", "status", "submissionRound"],
            where: {
                id,
            },
        });
    }

    public getSubmissions(ids: number[], transaction?: EntityManager): Promise<SubmissionModel[]> {
        if (ids.length === 0) {
            throw new Error("Please supply ids");
        }
        return this.getEntityManager(transaction).find({
            where: {
                id: In(ids),
            },
        });
    }

    public getUnverifiedSubmissions(ids: number[], transaction?: EntityManager): Promise<SubmissionModel[]> {
        if (ids.length === 0) {
            throw new Error("Please supply ids");
        }
        return this.getEntityManager(transaction).find({
            where: {
                id: In(ids),
                submissionValid: true,
                verified: false,
            },
        });
    }

    public getAllSubmissions(roundId: number, transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).find({
            relations: ["confirmation", "status", "submissionRound"],
            where: {
                submissionRoundId: roundId,
            },
        });
    }

    public async deleteSubmissions(submissions: SubmissionModel[], transaction?: EntityManager): Promise<boolean> {
        const entityManager = this.getEntityManager(transaction);
        try {
            await entityManager.remove(submissions);
        } catch (e) {
            this.logger.error(e);
            return false;
        }
        return true;
    }

    public getExpiredEntries(transaction?: EntityManager): Promise<SubmissionModel[]> {
        const nowMinus20Mins = new Date(Date.now() - 1200000).getTime();
        return this.getEntityManager(transaction).find({
            relations: ["confirmation"],
            where: {
                submissionValid: false,
                confirmation: {
                    createdAt: LessThanOrEqual(nowMinus20Mins),
                },
            },
        });
    }

    /**
     * Get all the submissions out of the currently active round and all the non-chosen submissions of the other rounds
     * @param transaction
     */
    public getCurrentAndNotChosenSubmissions(transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).find({
            relations: ["submissionRound"],
            where: [
                {
                    submissionRound: {
                        active: true,
                    },
                },
                {
                    isChosen: true,
                    submissionRound: {
                        active: false,
                    },
                },
            ],
        });
    }
}
