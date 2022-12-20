import {Configuration, Inject} from "@tsed/di";
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
import {Request} from "express";
import {FileFilterCallback} from "multer";
import {BadRequest} from "@tsed/exceptions";
import "@tsed/swagger";
import {isProduction} from "./config/envs";
import helmet from "helmet";
import process from "process";
import cors from "cors";
import {TypeormStore} from "connect-typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";
import {DataSource} from "typeorm";
import {SessionModel} from "./model/db/Session.model";

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
        fileFilter: function (req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
            const allowedFiles = process.env.ALLOWED_FILES;
            if (!allowedFiles) {
                return cb(null, true);
            }
            const fileExt = file.originalname.split(".").pop() ?? "";
            const allowedFilesArr = allowedFiles.split(",");
            if (!allowedFilesArr.includes(fileExt.toLowerCase())) {
                return cb(new BadRequest(`Invalid file: got ${fileExt}, expected: ${allowedFilesArr.join(", ")}`));
            }
            return cb(null, true);
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
    middlewares: [
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: {
                policy: "credentialless"
            }
        }),
        cors({
            origin: process.env.BASE_URL
        }),
        cookieParser(),
        methodOverride(),
        bodyParser.json(),
        bodyParser.urlencoded({
            extended: true
        }),
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
            specVersion: "3.0.3"
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

    public $beforeRoutesInit(): void | Promise<any> {
        if (isProduction) {
            this.app.getApp().set("trust proxy", 1);
        }
        this.app.use(session({
            secret: process.env.SESSION_KEY as string,
            resave: false,
            store: new TypeormStore({
                cleanupLimit: 2,
            }).connect(this.ds.getRepository(SessionModel)),
            saveUninitialized: false,
            cookie: {
                path: "/",
                httpOnly: true,
                maxAge: 86400000,
                secure: process.env.HTTPS === "true",
                sameSite: "strict"
            }
        }));
    }
}
