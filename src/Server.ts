import { Configuration, Constant, Inject } from "@tsed/di";
import type { BeforeRoutesInit } from "@tsed/common";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/socketio";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
// custom index imports
import "./protocols/index.js";
import "./filters/index.js";
import "./engine/impl/index.js";
import * as rest from "./controllers/rest";
import * as views from "./controllers/views";
import * as secureViews from "./controllers/secureViews";
// import * as secureViews from "./controllers/secureViews";
// custom index imports end
import { config } from "./config/index.js";
import { CustomUserInfoModel } from "./model/auth/CustomUserInfoModel.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import methodOverride from "method-override";
import { isProduction } from "./config/envs/index.js";
import helmet from "helmet";
import process from "process";
import cors from "cors";
import { TypeormStore } from "connect-typeorm";
import { SQLITE_DATA_SOURCE } from "./model/di/tokens.js";
import { DataSource } from "typeorm";
import { SessionModel } from "./model/db/Session.model.js";
import compression from "compression";
import GlobalEnv from "./model/constants/GlobalEnv.js";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { LRUCache } from "lru-cache";
import { fileURLToPath } from "node:url";
import { ExpressRateLimitTypeOrmStore } from "typeorm-rate-limit-store";
import { ExpressRateLimitStoreModel } from "./model/db/ExpressRateLimitStore.model.js";
import { Exception, TooManyRequests } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { DefaultRenderException } from "./model/rest/DefaultRenderException.js";
import { NetworkUtils, wadDir } from "./utils/Utils.js";

const opts: Partial<TsED.Configuration> = {
    ...config,
    acceptMimes: ["application/json"],
    httpPort: process.env.PORT ?? 8083,
    httpsPort: ((): number | boolean => {
        if (process.env.HTTPS === "true") {
            return Number.parseInt(process.env.HTTPS_PORT as string);
        }
        return false;
    })(),
    multer: {
        dest: wadDir,
        limits: {
            fileSize: Number.parseInt(process.env.FILE_SIZE_UPLOAD_LIMIT_MB as string) * 1048576,
        },
        preservePath: true,
    },
    passport: {
        userInfoModel: CustomUserInfoModel,
    },
    mount: {
        "/rest": [...Object.values(rest)],
        "/": [...Object.values(views)],
        "/secure": [...Object.values(secureViews)],
    },
    statics: {
        "/assets": [
            {
                root: `${path.dirname(fileURLToPath(import.meta.url))}/public/assets`,
            },
        ],
        "/tos": [
            {
                root: `${path.dirname(fileURLToPath(import.meta.url))}/public/tos.html`,
            },
        ],
        "/favicon.ico": [
            {
                // for safari...
                root: `${path.dirname(fileURLToPath(import.meta.url))}/public/assets/custom/images/favicon.ico`,
            },
        ],
        "/robots.txt": [
            {
                root: `${path.dirname(fileURLToPath(import.meta.url))}/public/robots.txt`,
            },
        ],
    },
    socketIO: {
        cors: {
            origin: process.env.BASE_URL,
        },
    },
    middlewares: [
        helmet({
            contentSecurityPolicy: false,
            crossOriginResourcePolicy: {
                policy: "cross-origin",
            },
            crossOriginEmbedderPolicy: {
                policy: "credentialless",
            },
        }),
        cors({
            origin: process.env.BASE_URL,
            exposedHeaders: ["Location", "Content-Disposition"],
        }),
        cookieParser(),
        methodOverride(),
        bodyParser.json(),
        bodyParser.urlencoded({
            extended: true,
        }),
        compression(),
    ],
    views: {
        root: `${path.dirname(fileURLToPath(import.meta.url))}/public`,
        viewEngine: "ejs",
        extensions: {
            ejs: "ejs",
        },
        options: {
            ejs: {
                rmWhitespace: false,
                cache: isProduction ? LRUCache : null,
            },
        },
    },
    exclude: ["**/*.spec.ts"],
};

if (!isProduction) {
    opts["swagger"] = [
        {
            path: "/api-docs",
            specVersion: "3.1.0",
            options: {
                withCredentials: true,
            },
        },
    ];
}

await initRedis();

@Configuration(opts)
export class Server implements BeforeRoutesInit {
    @Constant(GlobalEnv.SESSION_KEY)
    private readonly sessionKey: string;
    @Constant(GlobalEnv.HTTPS)
    private readonly https: string;
    @Constant(GlobalEnv.RATE_LIMIT_MS)
    private readonly rateLimitMs: string;
    @Constant(GlobalEnv.RATE_LIMIT)
    private readonly rateLimit: string;
    @Constant(GlobalEnv.REDIS_URI)
    private readonly redisUrl: string;

    public constructor(
        @Inject() private app: PlatformApplication,
        @Inject(SQLITE_DATA_SOURCE) private ds: DataSource,
        @Inject() private logger: Logger,
    ) {}

    public $beforeRoutesInit(): void {
        if (isProduction) {
            this.app.getApp().set("trust proxy", 1);
        }
        if (this.sessionKey) {
            this.app.use(
                session({
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
                        sameSite: "strict",
                    },
                }),
            );
        }
        if (this.rateLimit) {
            const howManyRequests = Number.parseInt(this.rateLimit);
            if (Number.isNaN(howManyRequests)) {
                throw new Error("RATE_LIMIT is not a number");
            }
            const rateLimitTimePeriod = Number.parseInt(this.rateLimitMs);
            if (Number.isNaN(rateLimitTimePeriod)) {
                throw new Error("RATE_LIMIT_MS not a number");
            }
            this.logger.info(`Enable rate limiting: ${howManyRequests} requests every ${rateLimitTimePeriod}ms`);
            this.app.use(
                rateLimit({
                    windowMs: rateLimitTimePeriod,
                    limit: howManyRequests,
                    standardHeaders: true,
                    message: this.parseError(new TooManyRequests("Too many requests, try again later")),
                    skip: request => {
                        if (request?.$ctx?.request?.request?.session?.passport) {
                            return true;
                        }
                        return request.path.includes("/admin") ? true : !request.path.includes("/rest");
                    },
                    keyGenerator: request => {
                        return NetworkUtils.getIp(request);
                    },
                    store: new ExpressRateLimitTypeOrmStore(this.ds.getRepository(ExpressRateLimitStoreModel)),
                }),
            );
        }
        if (this.redisUrl) {
            this.logger.info(`Connected IO to redis at ${this.redisUrl}`);
        }
    }

    private parseError(error: Exception): DefaultRenderException {
        return {
            name: error.origin?.name ?? error.name,
            message: error.message,
            status: error.status ?? 500,
        };
    }
}

async function initRedis(): Promise<void> {
    if (process.env.REDIS_URI) {
        const pubClient = createClient({ url: process.env.SOCKET_IO_REDIS });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        opts.socketIO!.adapter = createAdapter(pubClient, subClient);
    }
}
