import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { Input } from "../../components/Input/Input";
import { Panel } from "../../components/Panel/Panel";
import { useCreateRoundForm } from "../../hooks/useCreateRoundForm";
import styles from "./CreateRoundPanel.module.css";

type CreateRoundPanelProps = {
    onCreated: () => void;
};

export function CreateRoundPanel({ onCreated }: CreateRoundPanelProps) {
    const form = useCreateRoundForm(onCreated);
    const nameId = useId();
    const deadlineId = useId();

    return (
        <Panel title="No round is open" aria-label="Create round">
            <form className={styles.form} noValidate onSubmit={form.submit}>
                <p className={styles.intro}>Nobody can submit a WAD until you create a round.</p>

                <div className={styles.fields}>
                    <Field label="Round name" htmlFor={nameId}>
                        <Input
                            id={nameId}
                            fullWidth
                            required
                            value={form.name}
                            onChange={event => form.setName(event.target.value)}
                        />
                    </Field>

                    <Field label="Deadline (optional)" htmlFor={deadlineId}>
                        <Input
                            id={deadlineId}
                            type="date"
                            fullWidth
                            className={styles.date}
                            onChange={event => form.pickEndDate(event.target.valueAsNumber)}
                        />
                    </Field>

                    <Button type="submit" variant="primary" className={styles.create} disabled={form.creating}>
                        Create round
                    </Button>
                </div>

                <ErrorBanner message={form.error} />
            </form>
        </Panel>
    );
}
