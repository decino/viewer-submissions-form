import {Controller} from "@tsed/di";
import {Get} from "@tsed/schema";
import {Authorize} from "@tsed/passport";

@Controller("/hello-world")
export class HelloWorldController {

    @Get("/")
    @Authorize("*", {
        session: true
    })
    public get(): string {
        return "hello";
    }
}
