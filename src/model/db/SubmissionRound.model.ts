import {Column, Entity, OneToMany} from "typeorm";
import {AbstractModel} from "./AbstractModel";
import {SubmissionModel} from "./Submission.model";

@Entity()
export class SubmissionRoundModel extends AbstractModel {

    @Column({
        nullable: false
    })
    public active: boolean;

    @OneToMany(() => SubmissionModel, submissions => submissions.submissionRound)
    public submissions: SubmissionModel[];
}
