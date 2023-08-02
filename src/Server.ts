import {Configuration, Constant, Inject} from "@tsed/di";
import {BeforeRoutesInit, PlatformApplication} from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import {config} from "./config";
import * as rest from "./controllers/rest/index";
import * as views from "./controllers/views/index";
import * as secureViews from "./controllers/secureViews/index";
import {CustomUserInfoModel} from "./model/auth/CustomUserInfoModel";
import "./protocols/LoginLocalProtocol";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import methodOverride from "method-override";
import "@tsed/swagger";
import {isProduction} from "./config/envs";
import helmet from "helmet";
import process from "process";
import cors from "cors";
import {TypeormStore} from "connect-typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";
import {DataSource} from "typeorm";
import {SessionModel} from "./model/db/Session.model";
import compression from "compression";
import "./filters/HttpExceptionFilter";
import "./engine/impl/HttpErrorRenderers/index";
import GlobalEnv from "./model/constants/GlobalEnv";

const opts: Partial<TsED.Configuration> = {
    ...config,
    acceptMimes: ["application/json"],
    httpPort: process.env.PORT ?? 8083,
    httpsPort: (function (): number | boolean {
        if (process.env.HTTPS === "true") {
            return Number.parseInt(process.env.HTTPS_PORT as string);
        }
        return false;
    }()),
    componentsScan: [`./services/**/**.js`],
    multer: {
        dest: `${__dirname}/../customWads`,
        limits: {
            fileSize: Number.parseInt(process.env.FILE_SIZE_UPLOAD_LIMIT_MB as string) * 1048576
        },
        preservePath: true
    },
    passport: {
        userInfoModel: CustomUserInfoModel
    },
    mount: {
        "/rest": [
            ...Object.values(rest)
        ],
        "/": [
            ...Object.values(views)
        ],
        "/secure": [
            ...Object.values(secureViews)
        ]
    },
    statics: {
        "/": [
            {
                root: `${__dirname}/public`
            }
        ],
        "/secure": [
            {
                root: `${__dirname}/public`
            }
        ]
    },
    socketIO: {
        cors: {
            origin: process.env.BASE_URL
        }
    },
    middlewares: [
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: {
                policy: "credentialless"
            }
        }),
        cors({
            origin: process.env.BASE_URL,
            exposedHeaders: ["Location"]
        }),
        cookieParser(),
        methodOverride(),
        bodyParser.json(),
        bodyParser.urlencoded({
            extended: true
        }),
        compression()
    ],
    views: {
        root: `${__dirname}/public`,
        extensions: {
            ejs: "ejs"
        },
        options: {
            ejs: {
                rmWhitespace: isProduction
            }
        }
    },
    exclude: [
        "**/*.spec.ts"
    ]
};

if (!isProduction) {
    opts["swagger"] = [
        {
            path: "/api-docs",
            specVersion: "3.0.3",
            options: {
                withCredentials: true
            }
        }
    ];
}

@Configuration(opts)
export class Server implements BeforeRoutesInit {

    @Inject()
    protected app: PlatformApplication;

    @Configuration()
    protected settings: Configuration;

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Constant(GlobalEnv.SESSION_KEY)
    private readonly sessionKey: string;

    @Constant(GlobalEnv.HTTPS)
    private readonly https: string;

    public $beforeRoutesInit(): void | Promise<any> {
        if (isProduction) {
            this.app.getApp().set("trust proxy", 1);
        }
        this.app.use(session({
            secret: this.sessionKey,
            resave: false,
            store: new TypeormStore({
                cleanupLimit: 2,
            }).connect(this.ds.getRepository(SessionModel)),
            saveUninitialized: false,
            cookie: {
                path: "/",
                httpOnly: true,
                maxAge: 86400000,
                secure: this.https === "true",
                sameSite: "strict"
            }
        }));
    }
}
