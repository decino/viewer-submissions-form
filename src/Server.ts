import { Configuration, Constant, Inject } from "@tsed/di";
import type { AfterRoutesInit, BeforeRoutesInit } from "@tsed/common";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/socketio";
import "@tsed/platform-log-request";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
// custom index imports
import "./protocols/index.js";
import "./filters/index.js";
import "./engine/impl/index.js";
import * as rest from "./controllers/rest/index.js";
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
import fs from "node:fs";
import type { ServerResponse } from "node:http";
import type { NextFunction, Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { ExpressRateLimitTypeOrmStore } from "typeorm-rate-limit-store";
import { ExpressRateLimitStoreModel } from "./model/db/ExpressRateLimitStore.model.js";
import { Exception, TooManyRequests } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { DefaultRenderException } from "./model/rest/DefaultRenderException.js";
import { NetworkUtils, wadDir } from "./utils/Utils.js";

const frontendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "static");

function setStaticCacheHeaders(res: ServerResponse, filePath: string): void {
    const hashedAsset = filePath.split(path.sep).includes("assets");
    res.setHeader("Cache-Control", hashedAsset ? "public, max-age=31536000, immutable" : "no-cache");
}

const opts: Partial<TsED.Configuration> = {
    ...config,
    acceptMimes: ["application/json"],
    httpPort: process.env.PORT ?? 8083,
    httpsPort: ((): number | false => {
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
    },
    passport: {
        userInfoModel: CustomUserInfoModel,
    },
    mount: {
        "/rest": [...Object.values(rest)],
    },
    statics: {
        "/": [
            {
                root: frontendDir,
                index: false,
                setHeaders: setStaticCacheHeaders,
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
    exclude: ["**/*.spec.ts"],
};

await initRedis();

@Configuration(opts)
export class Server implements BeforeRoutesInit, AfterRoutesInit {
    @Constant(GlobalEnv.BASE_URL)
    private readonly baseUrl: string;
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
        this.app.use((request: Request, response: Response, next: NextFunction) => {
            response.on("close", () => {
                for (const file of Object.values(request.files ?? {}).flat()) {
                    fs.promises.rm(file.path, { force: true }).catch((error: unknown) => {
                        this.logger.error(`Unable to delete file ${file.path}`, error);
                    });
                }
            });
            next();
        });
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
                        return request.path.startsWith("/assets/");
                    },
                    keyGenerator: request => {
                        return ipKeyGenerator(NetworkUtils.getIp(request));
                    },
                    store: new ExpressRateLimitTypeOrmStore(this.ds.getRepository(ExpressRateLimitStoreModel)),
                }),
            );
        }
        if (this.redisUrl) {
            this.logger.info(`Connected IO to redis at ${this.redisUrl}`);
        }
    }

    public $afterRoutesInit(): void {
        const indexFile = path.join(frontendDir, "index.html");
        if (!fs.existsSync(indexFile)) {
            this.logger.warn(`No frontend build found at ${indexFile}, build the frontend to serve the site`);
            return;
        }

        const indexHtml = fs.readFileSync(indexFile, "utf8").replaceAll("__BASE_URL__", this.baseUrl);
        this.app.use((request: Request, response: Response, next: NextFunction) => {
            const isPageRequest = request.method === "GET" || request.method === "HEAD";
            if (!isPageRequest || request.path.startsWith("/rest") || path.extname(request.path) !== "") {
                next();
                return;
            }

            response.setHeader("Cache-Control", "no-cache");
            response.type("html").send(indexHtml);
        });
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
