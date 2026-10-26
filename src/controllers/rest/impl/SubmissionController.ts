import { Controller, Inject } from "@tsed/di";
import { CollectionOf, Delete, Get, Post, Required, Returns, Security } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { SubmissionModel } from "../../../model/db/Submission.model.js";
import { SubmissionService } from "../../../services/SubmissionService.js";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { BadRequest, InternalServerError, NotFound, Unauthorized } from "@tsed/exceptions";
import { SuccessModel } from "../../../model/rest/SuccessModel.js";
import { MultipartFile, type PlatformMulterFile } from "@tsed/platform-multer";
import { PlatformResponse, QueryParams, Req, Res, UseBefore } from "@tsed/common";
import { BaseRestController } from "../BaseRestController.js";
import { CustomWadEngine, CustomWadEntry } from "../../../engine/CustomWadEngine.js";
import { Authorize } from "@tsed/passport";
import { SubmissionStatusModel } from "../../../model/db/SubmissionStatus.model.js";
import { SubmissionConfirmationService } from "../../../services/SubmissionConfirmationService.js";
import { CaptchaMiddleWare } from "../../../middleware/endpoint/CaptchaMiddleWare.js";
import type { UUID } from "crypto";

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
    @(Returns(StatusCodes.CREATED, SubmissionModel).Groups("public"))
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public addEntry(
        @BodyParams() submission: SubmissionModel,
        @MultipartFile("file", 1) customWad?: PlatformMulterFile,
    ): Promise<unknown> {
        return this.submissionService.addEntry(submission, customWad);
    }

    @Post("/modifyEntry")
    @Authorize("loggedIn")
    @Security("login")
    @Returns(StatusCodes.OK, SubmissionModel)
    public modifyEntry(
        @BodyParams() submission: Record<string, string>,
        @MultipartFile("file", 1) replacementWad?: PlatformMulterFile,
    ): unknown {
        return this.submissionService.modifyEntry(submission, replacementWad);
    }

    @Post("/changeStatus")
    @Authorize("loggedIn")
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
    @Authorize("loggedIn")
    @Security("login")
    @Returns(StatusCodes.OK)
    public async setYoutubeLink(
        @Res() res: PlatformResponse,
        @Required() @PathParams("id") submissionId: number,
        @QueryParams("link") youtubeLink?: string,
    ): Promise<unknown> {
        await this.submissionService.addYoutubeToSubmission(submissionId, youtubeLink ?? null);
        return super.doSuccess(res, `Submission YouTube link has been assigned.`);
    }

    @Get("/getSubmission/:id")
    @Authorize("loggedIn")
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.OK, SubmissionModel)
    @Security("login")
    public getSubmission(@Required() @PathParams("id") id: number): Promise<unknown> {
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

    @Post("/confirm")
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async confirmSubmission(
        @Res() res: PlatformResponse,
        @Required() @BodyParams("uid") uid: string,
    ): Promise<PlatformResponse> {
        const result = await this.submissionConfirmationService.processConfirmation(uid as UUID);
        if (result.alreadyConfirmed) {
            return this.doSuccess(
                res,
                "This submission has already been confirmed and is awaiting manual verification. There is nothing more for you to do.",
            );
        }
        return this.doSuccess(
            res,
            "Your submission has been submitted and is awaiting manual verification. It will show as soon as it is verified.",
        );
    }

    @Post("/verifyEntries")
    @Authorize("basic")
    @Security("login")
    @Returns(StatusCodes.OK, SuccessModel)
    public async verifyEntries(
        @Res() res: PlatformResponse,
        @BodyParams() @CollectionOf(Number) ids: number[],
    ): Promise<unknown> {
        await this.submissionConfirmationService.verifySubmissions(ids);
        return super.doSuccess(res, `Entries have been verified.`);
    }

    @Delete("/deleteEntries")
    @Authorize("basic")
    @Security("login")
    @Returns(StatusCodes.OK, SuccessModel)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    public async deleteEntry(
        @Res() res: PlatformResponse,
        @BodyParams() @CollectionOf(Number) ids: number[],
        @QueryParams("notify") notify?: boolean,
    ): Promise<unknown> {
        const result = await this.submissionService.deleteEntries(ids, notify);
        if (!result) {
            throw new NotFound(`No entry with IDs ${ids.join(", ")} found.`);
        }
        return super.doSuccess(res, `Entries have been deleted.`);
    }

    @Get("/download/bot/:roundId/:id")
    @Returns(StatusCodes.OK, Buffer)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async downloadWadBot(
        @Req() req: Req,
        @Res() res: PlatformResponse,
        @PathParams("id") id: number,
        @PathParams("roundId") roundId: number,
        @QueryParams("token") token: string,
    ): Promise<unknown> {
        const [entry, wad] = await this.getWad(roundId, id, false, token);
        res.attachment(entry.customWadFileName as string);
        res.contentType("application/octet-stream");
        return wad.content;
    }

    private async getWad(
        roundId: number,
        entryId: number,
        adminLoggedIn = false,
        botToken?: string,
    ): Promise<[SubmissionModel, CustomWadEntry]> {
        const wad = await this.customWadEngine.getWad(roundId, entryId).catch(() => {
            throw new NotFound(`Unable to find WAD with ID: ${entryId} from round ${roundId}.`);
        });
        if (!wad) {
            throw new NotFound(`Unable to find WAD with ID: ${entryId} from round ${roundId}.`);
        }

        const entry = await this.submissionService.getEntry(entryId);
        if (!entry) {
            throw new InternalServerError("An error has occurred when trying to find this WAD's associated entry.");
        }

        const canDownload = botToken ? entry.downloadableViaBot(botToken) : entry.downloadable(adminLoggedIn);
        if (!canDownload) {
            throw new Unauthorized("Unable to download file.");
        }

        return [entry, wad];
    }
}
