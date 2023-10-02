import {AbstractModel} from "./AbstractModel";
import {BeforeInsert, Column, Entity, JoinColumn, OneToOne} from "typeorm";
import * as crypto from "crypto";
import {UUID} from "crypto";
import type {SubmissionModel} from "./Submission.model";
import {Description, Example, Name} from "@tsed/schema";

@Entity()
export class PendingEntryConfirmationModel extends AbstractModel {

    @Name("confirmationUid")
    @Description("UID of the confirmation")
    @Column({
        nullable: false,
        type: "text"
    })
    public confirmationUid: UUID;

    @Name("submissionId")
    @Description("The submission this entry belongs to")
    @Example("1")
    @Example("2")
    @Column({
        nullable: false
    })
    public submissionId: number;

    @OneToOne("SubmissionModel", "confirmation", {
        ...AbstractModel.cascadeOps
    })
    @JoinColumn({
        name: "submissionId",
        referencedColumnName: "id"
    })
    public submission: SubmissionModel;

    @BeforeInsert()
    private generateUid(): void {
        this.confirmationUid = crypto.randomUUID();
    }
}
