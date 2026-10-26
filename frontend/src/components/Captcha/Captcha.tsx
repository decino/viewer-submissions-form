import { Turnstile } from "@marsidev/react-turnstile";
import { captchaRequired } from "../../domain/site/captcha";
import { useCaptchaConfig } from "../../hooks/queries/site";
import styles from "./Captcha.module.css";

interface CaptchaProps {
    onToken: (token: string | null) => void;
    resetKey?: number;
}

export function Captcha({ onToken, resetKey }: CaptchaProps) {
    const { captcha } = useCaptchaConfig();

    if (!captcha?.siteKey || !captchaRequired(captcha)) {
        return null;
    }

    return (
        <div className={styles.captcha}>
            <Turnstile
                key={resetKey}
                siteKey={captcha.siteKey}
                options={{ theme: "dark" }}
                onSuccess={onToken}
                onExpire={() => onToken(null)}
                onError={() => onToken(null)}
            />
        </div>
    );
}
