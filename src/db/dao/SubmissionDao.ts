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

    public getSubmission(id: number, transaction?: EntityManager): Promise<SubmissionModel | null> {
        return this.getEntityManager(transaction).findOne({
            where: {
                id
            },
            relations: ["submissionRound"]
        });
    }

    public getSubmissions(ids: number[], transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).find({
            where: {
                id: In(ids)
            },
            relations: ["submissionRound"]
        });
    }

    public getAllSubmissions(roundId: number, transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction).findBy({
            id: roundId
        });
    }

    public async deleteSubmissions(submissions: SubmissionModel[], transaction?: EntityManager): Promise<boolean> {
        try {
            await this.getEntityManager(transaction).remove(submissions);
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
