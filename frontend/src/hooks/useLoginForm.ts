import { type SubmitEvent, useState } from "react";
import { captchaRequired } from "../domain/site/captcha";
import { errorMessage } from "../utils/errorMessage";
import { useCaptchaConfig } from "./queries/site";
import { useAuth } from "./useAuth";

export function useLoginForm() {
    const { user, loginUser } = useAuth();
    const { captcha, error: captchaError } = useCaptchaConfig();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaResetKey, setCaptchaResetKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (captchaRequired(captcha) && !captchaToken) {
            setError("Complete the captcha first");
            return;
        }

        setSending(true);

        try {
            await loginUser(email, password, captchaToken ?? undefined);
        } catch (failure) {
            setError(errorMessage(failure, "Could not log in. Try again."));
            setCaptchaToken(null);
            setCaptchaResetKey(key => key + 1);
        } finally {
            setSending(false);
        }
    }

    return {
        loggedIn: user !== null,
        email,
        setEmail,
        password,
        setPassword,
        captcha: {
            resetKey: captchaResetKey,
            onToken: setCaptchaToken,
        },
        error,
        captchaError,
        sending,
        submit,
    };
}
