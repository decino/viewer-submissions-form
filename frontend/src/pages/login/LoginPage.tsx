import { Navigate } from "react-router";
import { Button } from "../../components/Button/Button";
import { Captcha } from "../../components/Captcha/Captcha";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { Input } from "../../components/Input/Input";
import { Panel } from "../../components/Panel/Panel";
import { useLoginForm } from "../../hooks/useLoginForm";
import { usePageTitle } from "../../hooks/usePageTitle";
import styles from "./LoginPage.module.css";

export function LoginPage() {
    usePageTitle("Admin login");
    const form = useLoginForm();

    if (form.loggedIn) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className={styles.page}>
            <Panel title="Admin login">
                <form className={styles.form} onSubmit={form.submit}>
                    <Field label="Email address" htmlFor="login-email">
                        <Input
                            id="login-email"
                            type="email"
                            required
                            fullWidth
                            autoComplete="username"
                            value={form.email}
                            onChange={event => form.setEmail(event.target.value)}
                        />
                    </Field>

                    <Field label="Password" htmlFor="login-password">
                        <Input
                            id="login-password"
                            type="password"
                            required
                            fullWidth
                            autoComplete="current-password"
                            value={form.password}
                            onChange={event => form.setPassword(event.target.value)}
                        />
                    </Field>

                    <div className={styles.captcha}>
                        <Captcha onToken={form.captcha.onToken} resetKey={form.captcha.resetKey} />
                    </div>

                    <ErrorBanner message={form.captchaError} />
                    <ErrorBanner message={form.error} />

                    <Button type="submit" variant="primary" className={styles.submit} disabled={form.sending}>
                        Log in
                    </Button>
                </form>
            </Panel>
        </div>
    );
}
