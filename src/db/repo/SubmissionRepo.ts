import { Inject, Injectable, ProviderScope } from "@tsed/di";
import { SubmissionDao } from "../dao/SubmissionDao.js";
import { SubmissionConfirmationDao } from "../dao/SubmissionConfirmationDao.js";
import { SubmissionModel } from "../../model/db/Submission.model.js";
import { SubmissionStatusModel } from "../../model/db/SubmissionStatus.model.js";
import { PendingEntryConfirmationModel } from "../../model/db/PendingEntryConfirmation.model.js";

@Injectable({
    scope: ProviderScope.SINGLETON,
})
export class SubmissionRepo {
    @Inject()
    private submissionDao: SubmissionDao;

    @Inject()
    private submissionConfirmationDao: SubmissionConfirmationDao;

    public saveOrUpdateSubmissions(submissions: SubmissionModel[]): Promise<SubmissionModel[]> {
        return this.submissionDao.saveOrUpdateSubmissions(submissions);
    }

    public saveOrUpdateSubmission(entry: SubmissionModel): Promise<SubmissionModel> {
        return this.submissionDao.saveOrUpdateSubmission(entry);
    }

    public validateSubmission(confirmation: PendingEntryConfirmationModel): Promise<SubmissionModel> {
        const submission = confirmation.submission;
        return this.submissionDao.dataSource.transaction(async entityManager => {
            submission.submissionValid = true;
            const updatedEntry = await this.submissionDao.saveOrUpdateSubmission(submission, entityManager);
            await this.submissionConfirmationDao.deleteConfirmation(confirmation, entityManager);
            updatedEntry.confirmation = null;
            return updatedEntry;
        });
    }

    public getUnverifiedSubmissions(ids: number[]): Promise<SubmissionModel[]> {
        return this.submissionDao.getUnverifiedSubmissions(ids);
    }

    public verifySubmissions(submissions: SubmissionModel[]): Promise<SubmissionModel[]> {
        for (const submission of submissions) {
            submission.verified = true;
        }
        return this.saveOrUpdateSubmissions(submissions);
    }

    public retrieveSubmission(id: number): Promise<SubmissionModel | null> {
        return this.submissionDao.getSubmission(id);
    }

    public getAllSubmissions(roundId: number, validAndVerifiedOnly = false): Promise<SubmissionModel[]> {
        return this.submissionDao.getAllSubmissions(roundId, validAndVerifiedOnly);
    }

    public async setSubmissionStatus(status: SubmissionStatusModel): Promise<SubmissionModel> {
        const submission = await this.retrieveSubmission(status.submissionId);
        if (!submission || !submission.status) {
            throw new Error(`Unable to find submission with id ${status.submissionId}.`);
        }
        submission.status.status = status.status;
        submission.status.additionalInfo = status.additionalInfo ?? null;
        return this.saveOrUpdateSubmission(submission);
    }

    public getSubmissions(ids: number[]): Promise<SubmissionModel[]> {
        return this.submissionDao.getSubmissions(ids);
    }

    public async deleteSubmissions(submissions: number[] | SubmissionModel[]): Promise<boolean> {
        let submissionsToDelete: SubmissionModel[];

        if (typeof submissions[0] === "number") {
            submissionsToDelete = await this.getSubmissions(submissions as number[]);
        } else {
            submissionsToDelete = submissions as SubmissionModel[];
        }

        if (!submissionsToDelete || submissionsToDelete.length === 0) {
            return false;
        }

        try {
            await this.submissionDao.deleteSubmissions(submissionsToDelete);
        } catch {
            return false;
        }

        return true;
    }

    public getExpiredEntries(): Promise<SubmissionModel[]> {
        return this.submissionDao.getExpiredEntries();
    }

    public getCurrentAndNotChosenSubmissions(): Promise<SubmissionModel[]> {
        return this.submissionDao.getCurrentAndNotChosenSubmissions();
    }
}
