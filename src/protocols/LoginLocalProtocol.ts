import {Catch, ExceptionFilterMethods, PlatformContext, Req} from "@tsed/common";
import {Inject} from "@tsed/di";
import {BodyParams} from "@tsed/platform-params";
import {OnVerify, PassportException, Protocol} from "@tsed/passport";
import {IStrategyOptions, Strategy} from "passport-local";
import {UserModel} from "../model/db/User.model";
import {UsersService} from "../services/UserService";
import {HttpExceptionFilter} from "../filters/HttpExceptionFilter";
import {Unauthorized} from "@tsed/exceptions";

@Protocol<IStrategyOptions>({
    name: "login",
    useStrategy: Strategy,
    settings: {
        session: true,
        usernameField: "email",
        passwordField: "password",
    }
})
export class LoginLocalProtocol implements OnVerify {

    @Inject()
    private usersService: UsersService;

    public async $onVerify(@Req() request: Req, @BodyParams() credentials: UserModel): Promise<UserModel | false> {
        const {email, password} = credentials;
        const user = await this.usersService.getUser(email, password);
        if (!user) {
            return false;
        }
        return user;
    }
}

@Catch(PassportException)
export class PassportExceptionFilter implements ExceptionFilterMethods<PassportException> {

    @Inject()
    private httpExceptionFilter: HttpExceptionFilter;

    public catch(exception: PassportException, ctx: PlatformContext): unknown {
        if (exception.name === "AuthenticationError") {
            return this.httpExceptionFilter.catch(new Unauthorized("Unauthorized", exception.origin), ctx);
        }
        return this.httpExceptionFilter.catch(exception, ctx);
    }
}
