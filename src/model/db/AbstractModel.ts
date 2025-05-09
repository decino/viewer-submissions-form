import { CreateDateColumn, PrimaryGeneratedColumn, RelationOptions, UpdateDateColumn } from "typeorm";
import { Description, Name } from "@tsed/schema";

export abstract class AbstractModel {
    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    };

    @PrimaryGeneratedColumn("increment")
    @Name("id")
    @Description("The ID of this entry")
    public id: number;

    @CreateDateColumn()
    @Name("created")
    @Description("When this entry was created")
    public createdAt: number;

    @UpdateDateColumn()
    @Name("updated")
    @Description("When this entry was updated")
    public updatedAt: number;
}
