import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {AbstractDao} from "./AbstractDao";
import {SubmissionModel} from "../../model/db/Submission.model";
import {Logger} from "@tsed/logger";
import {SQLITE_DATA_SOURCE} from "../../model/di/tokens";
import {DataSource, EntityManager, In} from "typeorm";

@Injectable({
    scope: ProviderScope.SINGLETON
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

    public saveOrUpdateSubmissions(entries: SubmissionModel[], transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).save(entries);
    }

    public getSubmission(id: number, transaction?: EntityManager): Promise<SubmissionModel | null> {
        return this.getEntityManager(transaction).findOne({
            where: {
                id
            }
        });
    }

    public getSubmissions(ids: number[], transaction?: EntityManager): Promise<SubmissionModel[]> {
        if (ids.length === 0) {
            throw new Error("Please supply ids");
        }
        return this.getEntityManager(transaction).find({
            where: {
                id: In(ids)
            }
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
                verified: false
            },
            relations: ["submissionRound"]
        });
    }

    public getAllSubmissions(roundId: number, transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).find({
            where: {
                submissionRoundId: roundId,
            },
            relations: ["submissionRound"]
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

    public getInvalidSubmissions(transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).findBy({
            submissionValid: false
        });
    }

}
