import { AbstractModel } from "./AbstractModel.js";
import { BeforeInsert, Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { Description, Example, Name } from "@tsed/schema";
import { randomUUID, type UUID } from "crypto";
import { SubmissionModel } from "./Submission.model.js";

@Entity()
@Index(["token", "submissionId"], {
    unique: true,
})
export class BotDownloadAuthenticationModel extends AbstractModel {
    @Name("token")
    @Description("UID of the confirmation")
    @Column({
        nullable: false,
        type: "text",
    })
    public token: UUID;

    @Name("submissionId")
    @Description("The submission this entry belongs to")
    @Example("1")
    @Example("2")
    @Column({
        nullable: false,
    })
    public submissionId: number;

    @OneToOne("SubmissionModel", "botDownloadToken", {
        ...AbstractModel.cascadeOps,
    })
    @JoinColumn({
        name: "submissionId",
        referencedColumnName: "id",
    })
    public submission: SubmissionModel;

    @BeforeInsert()
    private generateUid(): void {
        this.token = randomUUID();
    }
}
