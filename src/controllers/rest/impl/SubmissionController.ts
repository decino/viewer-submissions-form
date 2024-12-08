import { Controller, Inject } from "@tsed/di";
import { Delete, Get, Post, Returns, Security } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { SubmissionModel } from "../../../model/db/Submission.model.js";
import { SubmissionService } from "../../../services/SubmissionService.js";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { BadRequest, InternalServerError, NotFound, Unauthorized } from "@tsed/exceptions";
import { SuccessModel } from "../../../model/rest/SuccessModel.js";
import {
    MultipartFile,
    type PlatformMulterFile,
    PlatformResponse,
    QueryParams,
    Req,
    Res,
    UseBefore,
} from "@tsed/common";
import { BaseRestController } from "../BaseRestController.js";
import { CustomWadEngine, CustomWadEntry } from "../../../engine/CustomWadEngine.js";
import { Authorize } from "@tsed/passport";
import { SubmissionStatusModel } from "../../../model/db/SubmissionStatus.model.js";
import { SubmissionConfirmationService } from "../../../services/SubmissionConfirmationService.js";
import { CaptchaMiddleWare } from "../../../middleware/endpoint/CaptchaMiddleWare.js";

@Controller("/submission")
export class SubmissionController extends BaseRestController {
    @Inject()
    private submissionService: SubmissionService;

    @Inject()
    private customWadEngine: CustomWadEngine;

    @Inject()
    private submissionConfirmationService: SubmissionConfirmationService;

    @Post("/addEntry")
    @UseBefore(CaptchaMiddleWare)
    @Returns(StatusCodes.CREATED, SubmissionModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public addEntry(
        @BodyParams() submission: SubmissionModel,
        @MultipartFile("file") customWad?: PlatformMulterFile,
    ): Promise<unknown> {
        return this.submissionService.addEntry(submission, customWad);
    }

    @Post("/modifyEntry")
    @Authorize("login")
    @Security("login")
    @Returns(StatusCodes.OK, SubmissionModel)
    public modifyEntry(
        @BodyParams() submission: Record<string, string>,
        @MultipartFile("file") replacementWad?: PlatformMulterFile,
    ): unknown {
        return this.submissionService.modifyEntry(submission, replacementWad);
    }

    @Post("/changeStatus")
    @Authorize("login")
    @Security("login")
    @Returns(StatusCodes.OK)
    public async changeStatus(
        @Res() res: PlatformResponse,
        @BodyParams() status: SubmissionStatusModel,
    ): Promise<unknown> {
        await this.submissionService.modifyStatus(status);
        return super.doSuccess(res, `Submission status has been changed.`);
    }

    @Post("/:id/setYoutubeLink")
    @Authorize("login")
    @Security("login")
    @Returns(StatusCodes.OK)
    public async setYoutubeLink(
        @Res() res: PlatformResponse,
        @PathParams("id") submissionId: number,
        @QueryParams("link") youtubeLink?: string,
    ): Promise<unknown> {
        await this.submissionService.addYoutubeToSubmission(submissionId, youtubeLink ?? null);
        return super.doSuccess(res, `Submission YouTube link has been assigned.`);
    }

    @Get("/getSubmission/:id")
    @Authorize("login")
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.OK, SubmissionModel)
    @Security("login")
    public getSubmission(@PathParams("id") id: number): Promise<unknown> {
        return this.submissionService.getEntry(id);
    }

    @Get("/download/:roundId/:id")
    @Returns(StatusCodes.OK, Buffer)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async downloadWad(
        @Req() req: Req,
        @Res() res: PlatformResponse,
        @PathParams("id") id: number,
        @PathParams("roundId") roundId: number,
    ): Promise<unknown> {
        const [entry, wad] = await this.getWad(roundId, id, req.user !== undefined);
        res.attachment(entry.customWadFileName as string);
        res.contentType("application/octet-stream");
        return wad.content;
    }

    @Post("/verifyEntries")
    @Authorize(["login", "basic"])
    @Security("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async verifyEntries(@Res() res: PlatformResponse, @BodyParams() ids: number[]): Promise<unknown> {
        await this.submissionConfirmationService.verifySubmissions(ids);
        return super.doSuccess(res, `Entries have been verified.`);
    }

    @Delete("/deleteEntries")
    @Authorize(["login", "basic"])
    @Security("login")
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async deleteEntry(
        @Res() res: PlatformResponse,
        @BodyParams() ids: number[],
        @QueryParams("notify") notify?: boolean,
    ): Promise<unknown> {
        const result = await this.submissionService.deleteEntries(ids, notify);
        if (!result) {
            throw new NotFound(`No entry with IDs ${ids.join(", ")} found.`);
        }
        return super.doSuccess(res, `Entries have been deleted.`);
    }

    private async getWad(roundId: number, entryId: number, secure = false): Promise<[SubmissionModel, CustomWadEntry]> {
        let wad: CustomWadEntry | null;
        try {
            wad = await this.customWadEngine.getWad(roundId, entryId);
        } catch {
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
            throw new Unauthorized("Unable to download file.");
        }
        return [entry, wad];
    }
}
