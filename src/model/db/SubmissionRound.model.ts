import xss from "xss";
import { AbstractModel } from "./AbstractModel.js";
import { BeforeInsert, Column, Entity, OneToMany } from "typeorm";
import { Description, Name } from "@tsed/schema";
import { SubmissionModel } from "./Submission.model.js";

@Entity()
export class SubmissionRoundModel extends AbstractModel {
    @Column({
        nullable: false,
    })
    @Name("active")
    @Description("If this round is active or not")
    public active: boolean;

    @Column({
        nullable: false,
    })
    @Name("name")
    @Description("The name of this round")
    public name: string;

    @Column({
        nullable: false,
        default: false,
    })
    @Name("paused")
    @Description("If this round is currently paused or not")
    public paused: boolean;

    @Column({
        name: "end_date",
        nullable: true,
        type: "datetime",
    })
    @Name("endDate")
    @Description("If this round is currently paused or not")
    public endDate: Date | null;

    @Name("submissions")
    @Description("List of submissions that belong to this round")
    @OneToMany(() => SubmissionModel, submissions => submissions.submissionRound, {
        cascade: true,
        eager: true,
    })
    public submissions: SubmissionModel[];

    @BeforeInsert()
    private sanitiseString(): void {
        this.name = xss(this.name);
    }
}
