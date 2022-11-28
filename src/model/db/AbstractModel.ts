import {CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {RelationOptions} from "typeorm/decorator/options/RelationOptions";

export abstract class AbstractModel {

    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    };

    @PrimaryGeneratedColumn("increment")
    public id: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}
