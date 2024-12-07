import { $on } from "@tsed/hooks";
import { AsyncTask, CronJob, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { logger } from "@tsed/di";
import cronstrue from "cronstrue";
import { classOf, isFunction, nameOf } from "@tsed/core";
import METHOD_EXECUTOR_TIME_UNIT from "../../constants/METHOD_EXECUTOR_TIME_UNIT.js";

const scheduler = new ToadScheduler();

/**
 * Run a task as defined by the supplied crontab
 * @param {string | ((instance: T) => string)} cronExpression - the cron or a function to get the cron
 * @param {boolean} runImmediately - if it should be run instantly
 * @returns {(target: T, propertyKey: string, descriptor: PropertyDescriptor) => void}
 * @constructor
 */
export function Cron<T>(
    cronExpression: string | ((instance: T) => string),
    runImmediately = false,
): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return function (target: T, propertyKey: string, descriptor: PropertyDescriptor): void {
        $on("$afterInvoke", classOf(target), (instance: T) => {
            if (isFunction(cronExpression)) {
                cronExpression = cronExpression(instance);
            }
            const className = nameOf(classOf(target));
            const jobName = `${className}.${propertyKey}`;
            const task = new AsyncTask(
                jobName,
                () => {
                    return descriptor.value.call(instance);
                },
                err => {
                    logger().error(err);
                },
            );
            const job = new CronJob(
                {
                    cronExpression,
                },
                task,
                {
                    preventOverrun: true,
                },
            );
            scheduler.addCronJob(job);
            const cronExplain = cronstrue.toString(cronExpression);
            logger().info(`Registered cron job ${jobName} to run ${cronExplain}`);
            if (runImmediately) {
                descriptor.value.call(instance);
            }
        });
    };
}

export function RunEvery<T>(
    time: number,
    timeUnit: METHOD_EXECUTOR_TIME_UNIT | string,
    runImmediately = false,
): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return function (target: T, propertyKey: string, descriptor: PropertyDescriptor): void {
        $on("$afterInvoke", classOf(target), (instance: T) => {
            const className = nameOf(classOf(target));
            const task = new AsyncTask(
                `${className}.${propertyKey}`,
                () => {
                    return descriptor.value.call(instance);
                },
                err => {
                    logger().error(err);
                },
            );
            const job = new SimpleIntervalJob(
                {
                    runImmediately,
                    [timeUnit]: time,
                },
                task,
            );
            logger().info(`Register method: "${className}.${propertyKey}()" to run every ${time} ${timeUnit}`);
            scheduler.addSimpleIntervalJob(job);
        });
    };
}
