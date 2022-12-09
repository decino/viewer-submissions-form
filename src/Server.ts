import {Configuration, Inject} from "@tsed/di";
import {PlatformApplication} from "@tsed/common";
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
import cors from "cors";
import {Request} from "express";
import {FileFilterCallback} from "multer";
import {BadRequest} from "@tsed/exceptions";
import {BeforeRoutesInit} from "@tsed/common/lib/types/interfaces/BeforeRoutesInit";
import "@tsed/swagger";
import {isProduction} from "./config/envs";


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
        "cors",
        "cookie-parser",
        "compression",
        "method-override",
        "json-parser",
        {use: "urlencoded-parser", options: {extended: true}}
    ],
    views: {
        root: `${__dirname}/public`,
        extensions: {
            ejs: "ejs"
        },
        options: {
            ejs: {
                rmWhitespace: true
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

    public $beforeRoutesInit(): void {
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
                    httpOnly: process.env.HTTPS === "false",
                    secure: process.env.HTTPS === "true"
                }
            }));
    }
}
