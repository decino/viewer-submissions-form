import {Column, Entity} from "typeorm";
import {Description, Example, Format, Required} from "@tsed/schema";
import {AbstractModel} from "./AbstractModel";

@Entity()
export class UserModel extends AbstractModel {

    @Column()
    @Description("User password")
    @Example("/5gftuD/")
    @Required()
    public password: string;

    @Column()
    @Description("User email")
    @Example("user@domain.com")
    @Format("email")
    @Required()
    public email: string;

}
