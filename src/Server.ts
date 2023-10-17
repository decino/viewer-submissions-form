import {Configuration, Constant, Inject} from "@tsed/di";
import {BeforeRoutesInit, PlatformApplication} from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/socketio";
import "@tsed/swagger";
import {LRUCache} from "lru-cache";
// custom index imports
import "./protocols";
import "./filters";
import "./engine/impl/HttpErrorRenderers";
import * as rest from "./controllers/rest";
import * as views from "./controllers/views";
import * as secureViews from "./controllers/secureViews";
// custom index imports end
import {config} from "./config";
import {CustomUserInfoModel} from "./model/auth/CustomUserInfoModel";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import methodOverride from "method-override";
import {isProduction} from "./config/envs";
import helmet from "helmet";
import process from "process";
import cors from "cors";
import {TypeormStore} from "connect-typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";
import {DataSource} from "typeorm";
import {SessionModel} from "./model/db/Session.model";
import compression from "compression";
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
        "/assets": [
            {
                root: `${__dirname}/public/assets`
            }
        ],
        "/tos": [
            {
                root: `${__dirname}/public/tos.html`
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
        viewEngine: "ejs",
        extensions: {
            ejs: "ejs"
        },
        options: {
            ejs: {
                rmWhitespace: isProduction,
                cache: isProduction ? LRUCache : null
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
