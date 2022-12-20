import {Controller, ProviderScope, Scope} from "@tsed/di";
import {Authenticate} from "@tsed/passport";
import {Get, Post, Returns} from "@tsed/schema";
import {Req, Res} from "@tsed/common";
import {StatusCodes} from "http-status-codes";

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl {

    @Post("/login")
    @Authenticate("login", {failWithError: true})
    @Returns(StatusCodes.MOVED_TEMPORARILY)
    @Returns(StatusCodes.UNAUTHORIZED)
    public login(@Req() req: Req, @Res() res: Res): void {
        res.redirect("/secure");
    }

    @Get("/logout")
    @Returns(StatusCodes.MOVED_TEMPORARILY)
    public logout(@Req() request: Req, @Res() res: Res): void {
        request.session.destroy(function () {
            res.redirect('/');
        });
    }
}
