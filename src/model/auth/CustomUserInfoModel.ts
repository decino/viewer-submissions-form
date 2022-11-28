import {Property} from "@tsed/schema";

export class CustomUserInfoModel {

    @Property()
    id: string;

    @Property()
    token: string;
}
