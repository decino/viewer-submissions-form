import { Controller, Inject } from "@tsed/di";
import { BaseRestController } from "../BaseRestController.js";
import { StatsService } from "../../../services/StatsService.js";
import { Get, Returns } from "@tsed/schema";
import { StatusCodes } from "http-status-codes";
import { BadRequest } from "@tsed/exceptions";
import { PathParams } from "@tsed/platform-params";
import { PublicStatsDto } from "../../../DTO/PublicStatsDto.js";

@Controller("/stats")
export class StatsController extends BaseRestController {
    public constructor(@Inject() private readonly statsService: StatsService) {
        super();
    }

    @Get("/:roundId")
    @Returns(StatusCodes.OK, PublicStatsDto)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public getStats(@PathParams("roundId") roundId: number): Promise<PublicStatsDto> {
        return this.statsService.getStats(roundId);
    }
}
