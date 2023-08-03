import {Column, Entity, JoinColumn, OneToOne} from "typeorm";
import {AbstractModel} from "./AbstractModel";
import STATUS from "../constants/STATUS";
import {Description, Enum, Example, Name, Nullable, Optional, Required} from "@tsed/schema";
import {SubmissionModel} from "./Submission.model";

@Entity()
export class SubmissionStatusModel extends AbstractModel {

    @Column({
        type: "text",
        nullable: false,
        default: STATUS.QUEUED
    })
    @Name("status")
    @Description("The current status of the submission")
    @Example("Completed")
    @Example("Rejected")
    @Example("In Progress")
    @Example("Queued")
    @Required()
    @Enum(STATUS)
    public status: STATUS;

    @Name("submissionId")
    @Description("The submission this entry belongs to")
    @Required()
    @Example("1")
    @Example("2")
    @Column({
        nullable: false,
        unique: true
    })
    public submissionId: number;


    @Column({
        type: "text",
        nullable: true,
        default: null
    })
    @Name("additionalInfo")
    @Description("Any additional info added by decino")
    @Optional()
    @Nullable(String)
    public additionalInfo?: string | null;

    @OneToOne("SubmissionModel", "status", AbstractModel.cascadeOps)
    @JoinColumn({
        name: "submissionId",
        referencedColumnName: "id"
    })
    public submission: SubmissionModel;

}
