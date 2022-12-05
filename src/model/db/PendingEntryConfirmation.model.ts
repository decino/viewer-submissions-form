import {AbstractModel} from "./AbstractModel";
import {BeforeInsert, Column, Entity, Index, JoinColumn, OneToOne} from "typeorm";
import * as crypto from "crypto";
import type {SubmissionModel} from "./Submission.model";
import {Description, Example, Format, Name, Required} from "@tsed/schema";

@Entity()
@Index(["submissionRoundId", "submitterEmail"], {
    unique: true
})
export class PendingEntryConfirmationModel extends AbstractModel {

    @Name("confirmationUid")
    @Description("Uid of the confirmation")
    @Column({
        nullable: false
    })
    public confirmationUid: string;

    @Column({
        nullable: false
    })
    @Name("email")
    @Description("Email of the submitter")
    @Example("foo@example.com")
    @Required()
    @Format("email")
    public submitterEmail: string;

    @Name("submissionRoundId")
    @Description("The submission round this entry belongs to")
    @Example("1")
    @Example("2")
    @Column({
        nullable: false
    })
    public submissionRoundId: number;

    @OneToOne("SubmissionModel", "confirmation", AbstractModel.cascadeOps)
    @JoinColumn([
        {
            name: "submitterEmail",
            referencedColumnName: "submitterEmail"
        },
        {
            name: "submissionRoundId",
            referencedColumnName: "submissionRoundId"
        }
    ])
    public submission: SubmissionModel;

    @BeforeInsert()
    private generateUid(): void {
        this.confirmationUid = crypto.randomUUID();
    }
}
