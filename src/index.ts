import "reflect-metadata";
import {$log, Logger, registerProvider} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import {Server} from "./Server";
import {DataSource} from "typeorm";
import {SQLITE_DATA_SOURCE} from "./model/di/tokens";

async function bootstrap(): Promise<void> {
    const dataSource = new DataSource({
        type: "better-sqlite3",
        entities: [`${__dirname}/model/db/**/*.model.{ts,js}`],
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
