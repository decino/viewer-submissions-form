import {Service} from "@tsed/di";
import {Job, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {SimpleIntervalSchedule} from "toad-scheduler/dist/lib/engines/simple-interval/SimpleIntervalSchedule";
import {AsyncTask} from "toad-scheduler/dist/lib/common/AsyncTask";

@Service()
export class ScheduleService {

    private static readonly scheduler = new ToadScheduler();

    public scheduleJob<T>(schedule: SimpleIntervalSchedule, jobHandler: (this: T) => Promise<void>, jobName: string, context: T): void {
        jobHandler = jobHandler.bind(context);
        const task = new AsyncTask(
            jobName,
            jobHandler
        );
        const job = new SimpleIntervalJob(schedule, task);
        ScheduleService.scheduler.addSimpleIntervalJob(job);
    }

    public stopJob(name: string): void {
        ScheduleService.scheduler.stopById(name);
    }

    public getAllJobs(): Job[] {
        return ScheduleService.scheduler.getAllJobs();
    }

    public getJob(name: string): Job {
        return ScheduleService.scheduler.getById(name);
    }
}
