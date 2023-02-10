import "reflect-metadata";
import {$log, Logger as TsEdLogger, registerProvider} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import {Server} from "./Server";
import {DataSource, Logger as TypeOrmLogger} from "typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";
import glob from "glob-promise";
import path from "path";
import {EntitySchema} from "typeorm/entity-schema/EntitySchema";


function resolve(...paths: string[]): string[] {
    return paths.flatMap(ps => glob.sync(ps.split(path.sep).join("/")));
}

async function getDbModules(): Promise<EntitySchema[]> {
    const files = resolve(`${__dirname}/model/db/**/*.model.{ts,js}`);
    const pArr = files.map((file) => import(file));
    const modules: Awaited<EntitySchema>[] = await Promise.all(pArr);
    return modules.map(module => Object.values(module)[0]);
}

async function bootstrap(): Promise<void> {
    const models = await getDbModules();
    const dataSource = new DataSource({
        type: "better-sqlite3",
        entities: models,
        synchronize: true,
        database: "main.sqlite"
    });

    registerProvider<DataSource>({
        provide: SQLITE_DATA_SOURCE,
        type: "typeorm:datasource",
        deps: [TsEdLogger],
        async useAsyncFactory(logger: TsEdLogger) {
            await dataSource.initialize();
            dataSource.setOptions({
                logger: new class LoggerProxy implements TypeOrmLogger {
                    public logQuery(query: string, parameters?: any[]): void {
                        logger.debug(query, parameters);
                    }

                    public logMigration(message: string): any {
                        logger.debug(message);
                    }

                    public log(level: "log" | "info" | "warn", message: any): void {
                        switch (level) {
                            case "log":
                                logger.info(message);
                                break;
                            case "info":
                                logger.info(message);
                                break;
                            case "warn":
                                logger.warn(message);
                                break;

                        }
                    }

                    public logSchemaBuild(message: string): void {
                        logger.debug(message);
                    }

                    public logQueryError(error: string | Error, query: string, parameters?: any[]): void {
                        logger.error(error, query, parameters);
                    }

                    public logQuerySlow(time: number, query: string, parameters?: any[]): void {
                        logger.warn(time, query, parameters);
                    }
                }
            });
            logger.info(`Connected with typeorm to database: ${dataSource.options.database}`);
            return dataSource;
        },
        hooks: {
            $onDestroy(dataSource) {
                return dataSource.isInitialized && dataSource.destroy();
            }
        }
    });

    try {
        const platform = await PlatformExpress.bootstrap(Server);
        await platform.listen();

        process.on("SIGINT", () => {
            platform.stop();
        });
    } catch (error) {
        $log.error({event: "SERVER_BOOTSTRAP_ERROR", message: error.message, stack: error.stack});
    }
}

bootstrap();
