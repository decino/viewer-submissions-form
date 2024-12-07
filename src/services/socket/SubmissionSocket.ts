import { Nsp, SocketService } from "@tsed/socketio";
import { SubmissionModel } from "../../model/db/Submission.model.js";
import * as SocketIO from "socket.io";

@SocketService("/submission")
export class SubmissionSocket {
    @Nsp
    private nsp: SocketIO.Namespace;

    public emitSubmission(payload: SubmissionModel): boolean {
        return this.nsp.emit("newSubmission", {
            id: payload.id,
            wadName: payload.wadName,
            wadLevel: payload.wadLevel,
        });
    }

    public emitSubmissionDelete(ids: number[]): boolean {
        return this.nsp.emit("deleteSubmission", ids);
    }
}
