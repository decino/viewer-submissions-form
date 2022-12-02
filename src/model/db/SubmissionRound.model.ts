import {Column, Entity, OneToMany} from "typeorm";
import {AbstractModel} from "./AbstractModel";
import {SubmissionModel} from "./Submission.model";
import {Description, Name} from "@tsed/schema";

@Entity()
export class SubmissionRoundModel extends AbstractModel {

    @Column({
        nullable: false
    })
    @Name("active")
    @Description("If this round is active or not")
    public active: boolean;

    @Name("submissions")
    @Description("List of submissions that belong to this round")
    @OneToMany(() => SubmissionModel, submissions => submissions.submissionRound)
    public submissions: SubmissionModel[];

    public getSubmissionsAsGroup(): Map<string, SubmissionModel[]> {
        if (!this.submissions) {
            return new Map();
        }
        const retMap = new Map<string, SubmissionModel[]>();
        for (const submission of this.submissions) {
            const submissionUrl = submission.wadURL;
            if (retMap.has(submissionUrl)) {
                retMap.get(submissionUrl)?.push(submission);
            } else {
                retMap.set(submissionUrl, []);
            }
        }
        return retMap;
    }
}
