import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormActions } from "../../components/FormActions/FormActions";
import { Input } from "../../components/Input/Input";
import { Panel } from "../../components/Panel/Panel";
import { SuccessMessage } from "../../components/SuccessMessage/SuccessMessage";
import { useChangeDetailsForm } from "../../hooks/useChangeDetailsForm";
import styles from "./AccountSettings.module.css";

export function AccountSettings() {
    const form = useChangeDetailsForm();
    const emailId = useId();
    const passwordId = useId();
    const confirmationId = useId();

    return (
        <Panel title="Your account">
            <form className={styles.form} noValidate onSubmit={form.submit}>
                <p className={styles.intro}>Change the email address and password you log in with.</p>

                <Field label="Email address" htmlFor={emailId}>
                    <Input
                        id={emailId}
                        type="email"
                        fullWidth
                        required
                        autoComplete="username"
                        value={form.email}
                        onChange={event => form.setEmail(event.target.value)}
                    />
                </Field>

                <Field label="New password" htmlFor={passwordId}>
                    <Input
                        id={passwordId}
                        type="password"
                        fullWidth
                        required
                        autoComplete="new-password"
                        value={form.password}
                        onChange={event => form.setPassword(event.target.value)}
                    />
                </Field>

                <Field label="Confirm new password" htmlFor={confirmationId}>
                    <Input
                        id={confirmationId}
                        type="password"
                        fullWidth
                        required
                        autoComplete="new-password"
                        value={form.confirmation}
                        onChange={event => form.setConfirmation(event.target.value)}
                    />
                </Field>

                <ErrorBanner message={form.error} />

                {form.saved && <SuccessMessage>Your login details were changed.</SuccessMessage>}

                <FormActions>
                    <Button type="submit" variant="primary" disabled={form.saving}>
                        Save details
                    </Button>
                </FormActions>
            </form>
        </Panel>
    );
}
