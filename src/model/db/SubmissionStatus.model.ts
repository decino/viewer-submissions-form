import {Column, Entity, JoinColumn, OneToOne} from "typeorm";
import {AbstractModel} from "./AbstractModel";
import STATUS from "../constants/STATUS";
import {Description, Enum, Example, Name} from "@tsed/schema";
import {SubmissionModel} from "./Submission.model";

@Entity()
export class SubmissionStatusModel extends AbstractModel {

    @Column({
        type: "text",
        nullable: false,
        default: STATUS.NONE
    })
    @Name("status")
    @Description("The current status of the submission")
    @Example("Completed")
    @Example("Rejected")
    @Example("In Progress")
    @Example("None")
    @Enum(STATUS)
    public status: STATUS;

    @Name("submissionRoundId")
    @Description("The submission round this entry belongs to")
    @Example("1")
    @Example("2")
    @Column({
        nullable: false
    })
    public submissionRoundId: number;


    @Column({
        type: "text",
        nullable: true,
        default: null
    })
    @Name("additionalInfo")
    @Description("Any additional info added by decino")
    public additionalInfo?: string | null;

    @OneToOne("SubmissionModel", "status", AbstractModel.cascadeOps)
    @JoinColumn([
        {
            name: "submissionRoundId",
            referencedColumnName: "submissionRoundId"
        }
    ])
    public submission: SubmissionModel;

}
