import { Controller, Inject, ProviderScope, Scope } from "@tsed/di";
import { Authenticate, Authorize } from "@tsed/passport";
import { Get, Post, Returns, Security } from "@tsed/schema";
import { PlatformResponse, Req, Res, UseBefore } from "@tsed/common";
import { StatusCodes } from "http-status-codes";
import { BodyParams } from "@tsed/platform-params";
import { UserModel } from "../../../../model/db/User.model.js";
import { UserService } from "../../../../services/UserService.js";
import { BaseRestController } from "../../BaseRestController.js";
import { CustomUserInfoModel } from "../../../../model/auth/CustomUserInfoModel.js";
import { CaptchaMiddleWare } from "../../../../middleware/endpoint/CaptchaMiddleWare.js";
import { SuccessModel } from "../../../../model/rest/SuccessModel.js";

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl extends BaseRestController {
    @Inject()
    private usersService: UserService;

    @Post("/login")
    @UseBefore(CaptchaMiddleWare)
    @Authenticate("login", { failWithError: true })
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.UNAUTHORIZED)
    public login(@Res() res: PlatformResponse): PlatformResponse {
        return this.doSuccess(res, "Authentication successful");
    }

    @Get("/current_user")
    @Authorize("loggedIn")
    @Security("login")
    @Returns(StatusCodes.OK, CustomUserInfoModel)
    @Returns(StatusCodes.UNAUTHORIZED)
    public getCurrentUser(@Req() req: Req, @Res() res: PlatformResponse): PlatformResponse {
        const loggedInUser = req.user as CustomUserInfoModel;
        if (!loggedInUser) {
            return this.doError(res, "Not authenticated", StatusCodes.UNAUTHORIZED);
        }
        return res.status(StatusCodes.OK).body(loggedInUser);
    }

    @Get("/logout")
    @Returns(StatusCodes.MOVED_TEMPORARILY)
    public logout(@Req() request: Req, @Res() res: Res): void {
        request.session.destroy(function () {
            res.redirect("/");
        });
    }

    @Post("/changeDetails")
    @Authorize("loggedIn")
    @Security("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async changeDetails(
        @Res() res: PlatformResponse,
        @Req() req: Req,
        @BodyParams() userDetails: UserModel,
    ): Promise<PlatformResponse> {
        const loggedInUser = req.user as CustomUserInfoModel;
        const updatedUser = await this.usersService.changeDetails(userDetails, loggedInUser);
        await new Promise<void>((resolve, reject) => {
            req.login(updatedUser, error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
        return this.doSuccess(res, "User details changed");
    }
}
