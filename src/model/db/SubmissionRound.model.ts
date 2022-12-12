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

    @Column({
        nullable: false,
        default: false
    })
    @Name("paused")
    @Description("If this round is currently paused or not")
    public paused: boolean;

    @Name("submissions")
    @Description("List of submissions that belong to this round")
    @OneToMany(() => SubmissionModel, submissions => submissions.submissionRound)
    public submissions: SubmissionModel[];
}
