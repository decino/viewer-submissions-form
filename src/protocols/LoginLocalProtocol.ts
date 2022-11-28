import {Req} from "@tsed/common";
import {Inject} from "@tsed/di";
import {BodyParams} from "@tsed/platform-params";
import {OnVerify, Protocol} from "@tsed/passport";
import {IStrategyOptions, Strategy} from "passport-local";
import {UserModel} from "../model/db/User.model";
import {UsersService} from "../services/UserService";
import {NotAuthorized} from "../exceptions/NotAuthorized";
import {StatusCodes} from "http-status-codes";

@Protocol<IStrategyOptions>({
    name: "login",
    useStrategy: Strategy,
    settings: {
        usernameField: "email",
        passwordField: "password"
    }
})
export class LoginLocalProtocol implements OnVerify {

    @Inject()
    private usersService: UsersService;

    public async $onVerify(@Req() request: Req, @BodyParams() credentials: UserModel): Promise<UserModel> {
        const {email, password} = credentials;
        const user = await this.usersService.getUser(email, password);
        if (!user) {
            throw new NotAuthorized("Wrong credentials", StatusCodes.UNAUTHORIZED);
        }
        return user;
    }
}
