import {Inject, Injectable, ProviderScope} from "@tsed/di";
import {SubmissionStatusModel} from "../../model/db/SubmissionStatus.model";
import {SubmissionDao} from "../dao/SubmissionDao";
import {SubmissionModel} from "../../model/db/Submission.model";
import {SubmissionConfirmationDao} from "../dao/SubmissionConfirmationDao";

@Injectable({
    scope: ProviderScope.SINGLETON
})
export class SubmissionRepo {

    @Inject()
    private submissionDao: SubmissionDao;

    @Inject()
    private submissionConfirmationDao: SubmissionConfirmationDao;

    public saveOrUpdateSubmission(entry: SubmissionModel): Promise<SubmissionModel> {
        return this.submissionDao.saveOrUpdateSubmission(entry);
    }

    public validateSubmission(submission: SubmissionModel): Promise<SubmissionModel> {
        return this.submissionDao.dataSource.transaction(async entityManager => {
            submission.submissionValid = true;
            const updatedEntry = await this.submissionDao.saveOrUpdateSubmission(submission, entityManager);
            if (updatedEntry.confirmation) {
                await this.submissionConfirmationDao.deleteConfirmation(updatedEntry.confirmation, entityManager);
                updatedEntry.confirmation = null;
            }
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
        return this.submissionDao.saveOrUpdateSubmissions(submissions);
    }


    public retrieveSubmission(id: number): Promise<SubmissionModel | null> {
        return this.submissionDao.getSubmission(id);
    }

    public getAllSubmissions(roundId: number): Promise<SubmissionModel[]> {
        return this.submissionDao.getAllSubmissions(roundId);
    }

    public async setSubmissionStatus(status: SubmissionStatusModel): Promise<SubmissionModel> {
        const submission = await this.retrieveSubmission(status.submissionId);
        if (!submission) {
            throw new Error(`Unable to find submission with id ${status.submissionId}.`);
        }
        submission.status = status;
        submission.status.additionalInfo = status.additionalInfo ?? null;
        return this.saveOrUpdateSubmission(submission);
    }

    public getSubmissions(ids: number[]): Promise<SubmissionModel[]> {
        return this.submissionDao.getSubmissions(ids);
    }

    public async deleteSubmissions(submissions: SubmissionModel[]): Promise<boolean>;
    public async deleteSubmissions(submissions: number[]): Promise<boolean>;
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
        } catch (e) {
            return false;
        }

        return true;
    }

    public getInvalidSubmissions(): Promise<SubmissionModel[]> {
        return this.submissionDao.getInvalidSubmissions();
    }

}
