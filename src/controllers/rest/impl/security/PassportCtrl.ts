import {Controller, ProviderScope, Scope} from "@tsed/di";
import {Authenticate} from "@tsed/passport";
import {Post, Returns} from "@tsed/schema";
import {Req, Res} from "@tsed/common";
import {UserModel} from "../../../../model/db/User.model";

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl {

    @Post("/login")
    @Authenticate("login", {failWithError: true})
    @Returns(200, UserModel)
    @Returns(400)
    public login(@Req() req: Req, @Res() res: Res): void {
        res.redirect("/secure");
    }
}
