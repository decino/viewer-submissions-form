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
            relations: ["confirmation", "status", "botDownloadToken"],
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

    public getAllSubmissions(
        roundId: number,
        validAndVerifiedOnly = false,
        transaction?: EntityManager,
    ): Promise<SubmissionModel[]> {
        const manager = this.getEntityManager(transaction);
        if (validAndVerifiedOnly) {
            return manager.find({
                relations: ["confirmation", "status"],
                where: {
                    submissionRoundId: roundId,
                    submissionValid: true,
                    verified: true,
                },
            });
        }
        return this.getEntityManager(transaction).find({
            relations: ["confirmation", "status"],
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
        return this.getEntityManager(transaction).find({
            relations: ["confirmation"],
            where: {
                submissionValid: false,
                confirmation: {
                    createdAt: LessThanOrEqual(new Date(Date.now() - 1200000)), // older than 20 mins
                },
            },
        });
    }

    /**
     * Get all the submissions out of the currently active round and all the non-chosen submissions of the other rounds
     * @param transaction
     */
    public getCurrentAndNotChosenSubmissions(transaction?: EntityManager): Promise<SubmissionModel[]> {
        return this.getEntityManager(transaction)
            .createQueryBuilder("submission")
            .innerJoin("submission.submissionRound", "round")
            .where("round.active = :active", { active: true })
            .orWhere("submission.isChosen = :isChosen AND round.active = :inactive", {
                isChosen: true,
                inactive: false
            })
            .getMany();
    }

    public getNumberOfSubmissions(
        roundId?: number,
        validAndVerifiedOnly = true,
        transaction?: EntityManager,
    ): Promise<number> {
        const manager = this.getEntityManager(transaction);
        const builder = manager.createQueryBuilder("submission");

        if (roundId) {
            builder.where("submission.submissionRoundId = :roundId", { roundId });
        } else {
            builder.innerJoin("submission.submissionRound", "submissionRound").where("submissionRound.active = true");
        }

        if (validAndVerifiedOnly) {
            builder.andWhere("submission.submissionValid = true AND submission.verified = true");
        }

        return builder.getCount();
    }

    public async getNumberOfSubmissionsForPreviousRound(
        validAndVerifiedOnly = true,
        transaction?: EntityManager,
    ): Promise<number> {
        const manager = this.getEntityManager(transaction);

        const previousRoundResult = await manager
            .createQueryBuilder("submission")
            .select("submission.submissionRoundId", "roundId")
            .where(qb => {
                const subQuery = qb
                    .subQuery()
                    .select("MAX(s.submissionRoundId)")
                    .from(SubmissionModel, "s")
                    .innerJoin("s.submissionRound", "activeRound")
                    .where("activeRound.active = true")
                    .getQuery();
                return `submission.submissionRoundId < (${subQuery})`;
            })
            .orderBy("submission.submissionRoundId", "DESC")
            .limit(1)
            .getRawOne();

        if (!previousRoundResult) {
            return 0;
        }

        // Count submissions in the previous round
        const builder = manager
            .createQueryBuilder("submission")
            .where("submission.submissionRoundId = :roundId", { roundId: previousRoundResult.roundId });

        if (validAndVerifiedOnly) {
            builder.andWhere("submission.submissionValid = true AND submission.verified = true");
        }

        return builder.getCount();
    }
}
