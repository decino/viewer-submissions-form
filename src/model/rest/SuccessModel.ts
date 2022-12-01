import {Description, Name} from "@tsed/schema";

export class SuccessModel {

    @Name("success")
    public success: boolean;

    @Name("description")
    @Description("the description of the success")
    public description: string;

    public constructor(success: boolean, description: string) {
        this.success = success;
        this.description = description;
    }
}
