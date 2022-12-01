import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource, DeleteResult} from "typeorm";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {NotFound} from "@tsed/exceptions";
import {PlatformMulterFile} from "@tsed/common";
import {CustomWadEngine} from "../engine/CustomWadEngine";

@Service()
export class SubmissionService {

    @Inject(SQLITE_DATA_SOURCE)
    private ds: DataSource;

    @Inject()
    private submissionRoundService: SubmissionRoundService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    public async addEntry(entry: SubmissionModel, customWad?: PlatformMulterFile): Promise<SubmissionModel> {
        const currentActiveRound = await this.submissionRoundService.getCurrentActiveSubmissionRound();
        if (!currentActiveRound) {
            throw new NotFound("can not add when there are no currently active rounds");
        }
        if (customWad) {
            entry.customWadFileName = customWad.originalname;
        }
        entry.submissionRoundId = currentActiveRound.id;
        const repo = this.ds.getRepository(SubmissionModel);
        const saveEntry = await repo.save(entry);
        if (customWad) {
            await this.customWadEngine.moveWad(saveEntry.id, customWad);
        }
        return saveEntry;
    }

    public deleteEntry(id: number): Promise<DeleteResult> {
        const repo = this.ds.getRepository(SubmissionModel);
        return repo.delete({
            id
        });
    }
}
