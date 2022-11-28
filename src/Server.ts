import {join} from "path";
import {Configuration, Inject} from "@tsed/di";
import {PlatformApplication} from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import {config} from "./config";
import * as rest from "./controllers/rest/index";
import {CustomUserInfoModel} from "./model/auth/CustomUserInfoModel";
import "./protocols/LoginLocalProtocol";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import methodOverride from "method-override";
import cors from "cors";

@Configuration({
    ...config,
    acceptMimes: ["application/json"],
    httpPort: process.env.PORT ?? 8083,
    httpsPort: (function (): string | boolean {
        if (process.env.HTTPS) {
            return process.env.HTTPS_PORT as string;
        }
        return false;
    }()),
    componentsScan: [`./services/**/**.js`],
    passport: {
        userInfoModel: CustomUserInfoModel
    },
    mount: {
        "/rest": [
            ...Object.values(rest)
        ]
    },
    middlewares: [
        "cors",
        "cookie-parser",
        "compression",
        "method-override",
        "json-parser",
        {use: "urlencoded-parser", options: {extended: true}}
    ],
    views: {
        root: join(process.cwd(), "../views"),
        extensions: {
            ejs: "ejs"
        }
    },
    exclude: [
        "**/*.spec.ts"
    ]
})
export class Server {
    @Inject()
    protected app: PlatformApplication;

    @Configuration()
    protected settings: Configuration;

    private $beforeRoutesInit(): void {
        this.app
            .use(cors())
            .use(cookieParser())
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }))
            .use(session({
                secret: process.env.SESSION_KEY as string,
                resave: true,
                saveUninitialized: true,
                // maxAge: 36000,
                cookie: {
                    path: "/",
                    httpOnly: !process.env.HTTPS,
                    secure: Boolean(process.env.HTTPS)
                }
            }));
    }
}
