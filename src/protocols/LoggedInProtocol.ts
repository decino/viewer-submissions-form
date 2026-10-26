import type { OnVerify } from "@tsed/passport";
import { Protocol } from "@tsed/passport";
import { Strategy } from "passport-custom";

@Protocol({
    name: "loggedIn",
    useStrategy: Strategy,
})
export class LoggedInProtocol implements OnVerify {
    public $onVerify(): false {
        return false;
    }
}
