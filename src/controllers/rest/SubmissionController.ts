import {Controller} from "@tsed/di";
import {Get} from "@tsed/schema";

@Controller("/hello-world")
export class SubmissionController {

    @Get("/")
    public get(): string {
        return "hello";
    }
}
