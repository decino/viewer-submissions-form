import {Description, Name} from "@tsed/schema";

export class ErrorModel {

    @Name("description")
    @Description("the description of the error")
    public error: string;

    public constructor(error: string) {
        this.error = error;
    }
}
