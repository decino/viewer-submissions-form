import {Column, Entity} from "typeorm";
import {AbstractModel} from "./AbstractModel";
import {Description, Name} from "@tsed/schema";
import SETTING from "../constants/Settings";

@Entity()
export class SettingsModel extends AbstractModel {

    @Column({
        nullable: false,
        type: "integer",
        unique: true
    })
    @Name("setting")
    @Description("key of the setting")
    public setting: SETTING;

    @Column({
        nullable: false
    })
    @Name("value")
    @Description("value of the setting")
    public value: string;
}
