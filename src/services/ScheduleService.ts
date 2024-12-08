import { Inject, Service } from "@tsed/di";
import { Job, ToadScheduler } from "toad-scheduler";
import schedule, { Job as DateJob, JobCallback } from "node-schedule";
import { Logger } from "@tsed/logger";
import { ObjectUtils } from "../utils/Utils.js";

@Service()
export class ScheduleService {
    private static readonly scheduler = new ToadScheduler();

    private static readonly dateSchedules: DateJob[] = [];

    @Inject()
    private logger: Logger;

    public scheduleJobAtDate<T>(name: string, when: Date, jobHandler: JobCallback, context: T): void {
        if (when.getTime() < Date.now()) {
            this.logger.warn(`Unable to schedule job "${name}" as the date (${when.toUTCString()}) is before now`);
            return;
        }
        jobHandler = jobHandler.bind(context);
        const job = schedule.scheduleJob(name, when, (fireDate: Date) => {
            jobHandler.call(context, fireDate);
            ObjectUtils.removeObjectFromArray(ScheduleService.dateSchedules, itm => itm === job);
        });
        ScheduleService.dateSchedules.push(job);
        this.logger.info(`Registered date job ${name} to run on ${when.toUTCString()}`);
    }

    public getAllIntervalJobs(): Job[] {
        return ScheduleService.scheduler.getAllJobs();
    }

    public getAllDateJobs(): DateJob[] {
        return ScheduleService.dateSchedules;
    }
}
