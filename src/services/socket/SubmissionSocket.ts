import {Nsp, SocketService} from "@tsed/socketio";
import {SubmissionModel} from "../../model/db/Submission.model";
import SocketIO from "socket.io";
import {Logger} from "@tsed/logger";
import {Inject} from "@tsed/di";

@SocketService("/submission")
export class SubmissionSocket {

    @Inject()
    private logger: Logger;

    @Nsp
    private nsp: SocketIO.Namespace;

    public emitSubmission(payload: SubmissionModel): boolean {
        return this.nsp.emit("newSubmission", {
            id: payload.id,
            wadName: payload.wadName,
            wadLevel: payload.wadLevel
        });
    }

    public emitSubmissionDelete(ids: number[]): boolean {
        return this.nsp.emit("deleteSubmission", ids);
    }

}
