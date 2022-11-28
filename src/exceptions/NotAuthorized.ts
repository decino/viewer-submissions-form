import {StatusCodes} from "http-status-codes";

export class NotAuthorized extends Error {

    private readonly _status: StatusCodes;

    public constructor(message: string, status: StatusCodes) {
        super(message);
        this._status = status;
    }

    public get status(): StatusCodes {
        return this._status;
    }
}
