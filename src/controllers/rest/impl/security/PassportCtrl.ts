import {Controller, ProviderScope, Scope} from "@tsed/di";
import {Authenticate} from "@tsed/passport";
import {Post, Returns} from "@tsed/schema";
import {BodyParams} from "@tsed/platform-params";
import {Req} from "@tsed/common";
import {UserModel} from "../../../../model/db/User.model";

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl {

    @Post("/login")
    @Authenticate("login", {failWithError: false})
    @Returns(200, UserModel)
    @Returns(400)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public login(@Req() req: Req, @BodyParams() credentials: UserModel): unknown {
        // FACADE
        return req.user;
    }

}
