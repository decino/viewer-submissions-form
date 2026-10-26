import { Controller, Inject } from "@tsed/di";
import { Get, Returns } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { Builder } from "builder-pattern";
import { BaseRestController } from "../BaseRestController.js";
import { CaptchaManager } from "../../../manager/CaptchaManager.js";
import { WadValidationService } from "../../../services/WadValidationService.js";
import { CaptchaConfigDto } from "../../../DTO/CaptchaConfigDto.js";
import { UploadConfigDto } from "../../../DTO/UploadConfigDto.js";

@Controller("/config")
export class ConfigController extends BaseRestController {
    public constructor(
        @Inject() private captchaManager: CaptchaManager,
        @Inject() private wadValidationService: WadValidationService,
    ) {
        super();
    }

    @Get("/captcha")
    @Returns(StatusCodes.OK, CaptchaConfigDto)
    public getCaptchaConfig(): CaptchaConfigDto {
        const engine = this.captchaManager.engine;
        return Builder(CaptchaConfigDto)
            .captchaType(engine?.type ?? null)
            .siteKey(engine?.siteKey ?? null)
            .build();
    }

    @Get("/upload")
    @Returns(StatusCodes.OK, UploadConfigDto)
    public getUploadConfig(): UploadConfigDto {
        return Builder(UploadConfigDto)
            .fileSizeLimitMb(this.wadValidationService.fileSizeLimitMb)
            .allowedExtensions(this.wadValidationService.allowedFiles)
            .build();
    }
}
