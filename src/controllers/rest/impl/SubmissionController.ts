import {Controller, Inject} from "@tsed/di";
import {Delete, Get, Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {SubmissionModel} from "../../../model/db/Submission.model";
import {SubmissionService} from "../../../services/SubmissionService";
import {BodyParams, PathParams} from "@tsed/platform-params";
import {BadRequest, InternalServerError, NotFound} from "@tsed/exceptions";
import {SuccessModel} from "../../../model/rest/SuccessModel";
import {MultipartFile, PlatformMulterFile, PlatformResponse, Res, UseBefore} from "@tsed/common";
import {BaseRestController} from "../BaseRestController";
import {CustomWadEngine, CustomWadEntry} from "../../../engine/CustomWadEngine";
import {Authorize} from "@tsed/passport";
import {ReCAPTCHAMiddleWare} from "../../../middleware/endpoint/ReCAPTCHAMiddleWare";
import {SubmissionStatusModel} from "../../../model/db/SubmissionStatus.model";

@Controller("/submission")
export class SubmissionController extends BaseRestController {

    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Post("/addEntry")
    @UseBefore(ReCAPTCHAMiddleWare)
    @Returns(StatusCodes.CREATED, SubmissionModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public addEntry(@BodyParams() submission: SubmissionModel, @MultipartFile("file") customWad?: PlatformMulterFile): Promise<unknown> {
        return this.submissionService.addEntry(submission, customWad);
    }

    @Post("/modifyEntry")
    @UseBefore(ReCAPTCHAMiddleWare)
    @Authorize("login")
    @Returns(StatusCodes.OK, SubmissionModel)
    public modifyEntry(@BodyParams() submission: any): unknown {
        return this.submissionService.modifyEntry(submission);
    }

    @Post("/changeStatus")
    @Authorize("login")
    @Returns(StatusCodes.OK)
    public async changeStatus(@Res() res: PlatformResponse, @BodyParams() status: SubmissionStatusModel): Promise<unknown> {
        await this.submissionService.modifyStatus(status);
        return super.doSuccess(res, `Submission status has been changed`);
    }

    @Get("/downloadWadSecure/:roundId/:id")
    @Authorize("login")
    @Returns(StatusCodes.CREATED, Buffer)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async downloadWadSecure(@Res() res: PlatformResponse, @PathParams("id") id: number, @PathParams("roundId") roundId: number): Promise<unknown> {
        const [entry, wad] = await this.getWad(roundId, id, true);
        res.attachment(entry.customWadFileName as string);
        res.contentType("application/octet-stream");
        return wad.content;
    }


    @Get("/getSubmission/:id")
    @Authorize("login")
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.OK, SubmissionModel)
    public getSubmission(@Res() res: PlatformResponse, @PathParams("id") id: number): Promise<unknown> {
        return this.submissionService.getEntry(id);
    }

    @Get("/downloadWad/:roundId/:id")
    @Returns(StatusCodes.OK, Buffer)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async downloadWad(@Res() res: PlatformResponse, @PathParams("id") id: number, @PathParams("roundId") roundId: number): Promise<unknown> {
        const [entry, wad] = await this.getWad(roundId, id);
        res.attachment(entry.customWadFileName as string);
        res.contentType("application/octet-stream");
        return wad.content;
    }

    @Delete("/deleteEntries")
    @Authorize("login")
    @Returns(StatusCodes.CREATED, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async deleteEntry(@Res() res: PlatformResponse, @BodyParams() ids: number[]): Promise<unknown> {
        const result = await this.submissionService.deleteEntries(ids);
        if (!result) {
            throw new NotFound(`No entry with IDs ${ids.join(", ")} found.`);
        }
        return super.doSuccess(res, `Entries have been deleted.`);
    }

    private async getWad(roundId: number, entryId: number, secure = false): Promise<[SubmissionModel, CustomWadEntry]> {
        let wad: CustomWadEntry | null;
        try {
            wad = await this.customWadEngine.getWad(roundId, entryId);
        } catch (e) {
            throw new NotFound(`Unable to find WAD with ID: ${entryId} from round ${roundId}.`);
        }
        if (!wad) {
            throw new NotFound(`Unable to find WAD with ID: ${entryId} from round ${roundId}.`);
        }
        const entry = await this.submissionService.getEntry(entryId);
        if (!entry) {
            throw new InternalServerError("An error has occurred when trying to find this WAD's associated entry.");
        }
        if (!entry.downloadable(secure)) {
            throw new BadRequest("Unable to download file");
        }
        return [entry, wad];
    }
}
