import {AbstractModel} from "./AbstractModel";
import {Column, Entity, Index, JoinColumn, ManyToOne, OneToOne} from "typeorm";
import {CollectionOf, Description, Enum, Example, Format, Ignore, Name, Required} from "@tsed/schema";
import GZDOOM_ACTIONS from "../constants/GZDoomActions";
import type {SubmissionRoundModel} from "./SubmissionRound.model";
import DOOM_ENGINE from "../constants/DoomEngine";
import type {PendingEntryConfirmationModel} from "./PendingEntryConfirmation.model";

@Entity()
// entries with same submissionRoundId must have unique emails
@Index(["submissionRoundId", "submitterEmail"], {
    unique: true
})
export class SubmissionModel extends AbstractModel {

    @Column({
        nullable: false,
    })
    @Name("WADName")
    @Description("The URL of the wad")
    @Example("Alien Vendetta")
    @Example("Sunlust")
    @Required()
    public wadName: string;

    @Column({
        nullable: true,
    })
    @Name("WAD")
    @Description("The URL of the wad")
    @Example("https://www.doomworld.com/idgames/levels/doom2/Ports/megawads/sunlust")
    public wadURL: string;

    @Column({
        nullable: false
    })
    @Name("level")
    @Description("The level of the wad to play")
    @Example("12")
    @Example("E1M3")
    @Required()
    public wadLevel: string;

    @Column({
        type: "integer",
        nullable: false
    })
    @Name("engine")
    @Description("What game engine to use")
    @Example("Classic Doom")
    @Example("Boom")
    @Example("GZDoom")
    @Enum(DOOM_ENGINE)
    @Required()
    public wadEngine: DOOM_ENGINE;

    @Column({
        type: "simple-array",
        nullable: true,
        default: null
    })
    @Name("gzDoomAction")
    @Description("GZDoom parameters")
    @Example("mouselook, crouch")
    @Example("jump")
    @Example("mouselook")
    @Example("")
    @Enum(GZDOOM_ACTIONS)
    @CollectionOf(Number).MaxItems(3).MinItems(0)
    public gzDoomActions: GZDOOM_ACTIONS[];

    @Column({
        nullable: true
    })
    @Name("authorName")
    @Description("Submitter name")
    @Example("Victoria")
    @Example("")
    public submitterName: string;

    @Column({
        default: false
    })
    @Name("author")
    @Description("Did you make this map?")
    @Example("yes")
    @Example("no")
    public submitterAuthor: boolean;

    @Column({
        default: false
    })
    @Name("distributable")
    @Description("If you made this, am i allowed to distribute it to the public?")
    @Example("yes")
    @Example("no")
    public distributable: boolean;

    @Column({
        nullable: true
    })
    @Name("info")
    @Description("Additional info")
    @Example("This wad was made in 4 years")
    @Example("I like cats")
    public info: string;

    @Name("submissionRoundId")
    @Description("The submission round this entry belongs to")
    @Example("1")
    @Example("2")
    @Column({
        nullable: false
    })
    public submissionRoundId: number;

    @Column({
        nullable: true
    })
    @Name("customWad")
    @Description("The custom wad to play")
    @Ignore()
    public customWadFileName: string;

    @Column({
        nullable: false
    })
    @Name("email")
    @Description("Email of the submitter")
    @Example("foo@example.com")
    @Required()
    @Format("email")
    public submitterEmail: string;

    @Column({
        nullable: false,
        default: false
    })
    @Name("submissionValid")
    @Description("Valid if the user clicks the confirmation URL")
    public submissionValid: boolean;


    @Name("submissionRound")
    @Description("The submission round this entry belongs to")
    @ManyToOne("SubmissionRoundModel", "submissions", AbstractModel.cascadeOps)
    @JoinColumn({
        name: "submissionRoundId",
        referencedColumnName: "id"
    })
    public submissionRound: SubmissionRoundModel;

    @Name("confirmation")
    @Description("The confirmation (if any) that this submission belongs to")
    @OneToOne("PendingEntryConfirmationModel", "submission")
    public confirmation: PendingEntryConfirmationModel;

    @Column({
        nullable: true
    })
    @Name("chosenRound")
    @Description("the round id that this entry was chosen for")
    public chosenRoundId: number;

}
