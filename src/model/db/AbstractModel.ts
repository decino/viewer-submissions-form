import {CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {RelationOptions} from "typeorm/decorator/options/RelationOptions";
import {Description, Ignore, Name} from "@tsed/schema";

export abstract class AbstractModel {

    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        cascade: true
    };

    @PrimaryGeneratedColumn("increment")
    @Name("id")
    @Description("the id of this entry")
    public id: number;

    @CreateDateColumn()
    @Name("created")
    @Description("When this entry was created")
    public createdAt: Date;

    @UpdateDateColumn()
    @Name("updated")
    @Ignore()
    @Description("When this entry was updated")
    public updatedAt: Date;
}
