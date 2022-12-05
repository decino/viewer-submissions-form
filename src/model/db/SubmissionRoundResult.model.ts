import {AbstractModel} from "./AbstractModel";
import {Column, Entity, Index, JoinColumn, OneToOne} from "typeorm";
import {Description, Name} from "@tsed/schema";
import {SubmissionRoundModel} from "./SubmissionRound.model";

@Entity()
@Index(["submissionId", "submissionRoundId"], {
    unique: true
})
export class SubmissionRoundResultModel extends AbstractModel {

    @Name("submissionRoundId")
    @Description("The submission round this result specifies")
    @Column({
        nullable: false
    })
    public submissionRoundId: number;

    @Name("submissionId")
    @Description("The submission id")
    @Column({
        nullable: false
    })
    public submissionId: number;

    @OneToOne("SubmissionRoundModel", "submissionRoundResult")
    @JoinColumn({
        name: "submissionRoundId",
        referencedColumnName: "id"
    })
    public submission: SubmissionRoundModel;

}
