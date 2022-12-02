import {Inject, Service} from "@tsed/di";
import {SQLITE_DATA_SOURCE} from "../model/di/tokens";
import {DataSource} from "typeorm";
import {SubmissionModel} from "../model/db/Submission.model";
import {SubmissionRoundService} from "./SubmissionRoundService";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {PlatformMulterFile} from "@tsed/common";
import {CustomWadEngine} from "../engine/CustomWadEngine";
import {SubmissionRoundModel} from "../model/db/SubmissionRound.model";

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
        if (!this.canAddEntry(entry, currentActiveRound)) {
            throw new BadRequest("This level for this wad has already been requested, please try a different map or wad, or you have already submitted a request");
        }
        if (customWad) {
            const allowed = await this.customWadEngine.validateFile(customWad);
            if (!allowed) {
                await this.customWadEngine.deleteCustomWad(customWad);
                throw new BadRequest("invalid file, header mismatch");
            }
            entry.customWadFileName = customWad.originalname;
        }
        entry.submissionRoundId = currentActiveRound.id;
        const repo = this.ds.getRepository(SubmissionModel);
        const saveEntry = await repo.save(entry);
        if (customWad) {
            await this.customWadEngine.moveWad(saveEntry.id, customWad, currentActiveRound.id);
        }
        return saveEntry;
    }

    public async getEntry(id: number): Promise<SubmissionModel | null> {
        const repo = this.ds.getRepository(SubmissionModel);
        const entry = await repo.findOne({
            where: {
                id
            }
        });
        if (!entry) {
            return null;
        }
        return entry;
    }

    public async deleteEntry(id: number): Promise<SubmissionModel | null> {
        const repo = this.ds.getRepository(SubmissionModel);
        const entry = await repo.findOne({
            where: {
                id
            }
        });
        if (!entry) {
            return null;
        }
        const removedItem = await repo.remove(entry);
        if (entry.customWadFileName) {
            await this.customWadEngine.deleteCustomWad(id);
        }
        return removedItem;
    }

    private canAddEntry(entry: SubmissionModel, round: SubmissionRoundModel): boolean {
        const wadUrl = entry.wadURL;
        const submitterName = entry.submitterName;
        const level = entry.wadLevel;
        const alreadySubmitted = round.submissions.find(entry => (entry.wadURL === wadUrl && entry.wadLevel === level) || entry.submitterName === submitterName);
        return !alreadySubmitted;
    }
}
