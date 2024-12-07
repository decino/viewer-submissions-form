import { AbstractModel } from "./AbstractModel.js";
import { Column, Entity } from "typeorm";
import { Description, Name } from "@tsed/schema";
import SETTING from "../constants/Settings.js";

@Entity()
export class SettingsModel extends AbstractModel {
    @Column({
        nullable: false,
        type: "text",
        unique: true,
    })
    @Name("setting")
    @Description("key of the setting")
    public setting: SETTING;

    @Column({
        nullable: false,
    })
    @Name("value")
    @Description("value of the setting")
    public value: string;
}
