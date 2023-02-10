import "reflect-metadata";
import {$log, Logger, registerProvider} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import {Server} from "./Server";
import {DataSource} from "typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";
import glob from "glob-promise";
import path from "path";
import {EntitySchema} from "typeorm/entity-schema/EntitySchema";


function resolve(...paths: string[]): string[] {
    return paths.flatMap(ps => glob.sync(ps.split(path.sep).join("/")));
}

async function getdbModules(): Promise<EntitySchema[]> {
    const files = resolve(`${__dirname}/model/db/**/*.model.{ts,js}`);
    const pArr = files.map((file) => import(file));
    const modules: Awaited<EntitySchema>[] = await Promise.all(pArr);
    return modules.map(module => Object.values(module)[0]);
}

async function bootstrap(): Promise<void> {
    const models = await getdbModules();
    const dataSource = new DataSource({
        type: "better-sqlite3",
        entities: models,
        synchronize: true,
        database: "main.sqlite"
    });

    registerProvider<DataSource>({
        provide: SQLITE_DATA_SOURCE,
        type: "typeorm:datasource",
        deps: [Logger],
        async useAsyncFactory(logger: Logger) {
            await dataSource.initialize();
            logger.info("Connected with typeorm to database: main.sqlite");
            return dataSource;
        },
        hooks: {
            $onDestroy(dataSource) {
                return dataSource.isInitialized && dataSource.close();
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
