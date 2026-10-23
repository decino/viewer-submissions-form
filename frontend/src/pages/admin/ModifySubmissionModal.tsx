import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { ChoiceGroup } from "../../components/ChoiceGroup/ChoiceGroup";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormActions } from "../../components/FormActions/FormActions";
import { Input } from "../../components/Input/Input";
import { Modal } from "../../components/Modal/Modal";
import { Select } from "../../components/Select/Select";
import { DOOM_ENGINES, RECORDED_FORMATS, YES_NO } from "../../domain/submission/labels";
import { useModifySubmissionForm } from "../../hooks/useModifySubmissionForm";
import styles from "./ModifySubmissionModal.module.css";

interface ModifySubmissionFormProps {
    submissionId: number;
    onClose: () => void;
}

interface ModifySubmissionModalProps {
    submissionId: number | null;
    onClose: () => void;
}

function ModifySubmissionForm({ submissionId, onClose }: ModifySubmissionFormProps) {
    const { loading, loadError, draft, hasWadUrl, update, submit, saving, error } = useModifySubmissionForm(
        submissionId,
        onClose,
    );
    const baseId = useId();

    if (loading) {
        return <p className={styles.status}>Loading the submission...</p>;
    }

    if (loadError) {
        return <ErrorBanner message={loadError} />;
    }

    if (!draft) {
        return <p className={styles.status}>This submission could not be found.</p>;
    }

    return (
        <form className={styles.form} onSubmit={submit}>
            <ChoiceGroup
                legend="Did the submitter make this level?"
                name={`${baseId}-author`}
                choices={YES_NO}
                value={draft.author}
                onChange={value => update("author", value)}
            />

            {draft.author && (
                <ChoiceGroup
                    legend="May it be shared with viewers?"
                    name={`${baseId}-distributable`}
                    choices={YES_NO}
                    value={draft.distributable}
                    onChange={value => update("distributable", value)}
                />
            )}

            <ChoiceGroup
                legend="Recording format"
                name={`${baseId}-format`}
                choices={RECORDED_FORMATS}
                value={draft.recordedFormat}
                onChange={value => update("recordedFormat", value)}
            />

            {hasWadUrl && (
                <Field label="WAD download URL" htmlFor={`${baseId}-url`}>
                    <Input
                        id={`${baseId}-url`}
                        type="url"
                        required
                        fullWidth
                        value={draft.wadUrl}
                        onChange={event => update("wadUrl", event.target.value)}
                    />
                </Field>
            )}

            <Field label="WAD name" htmlFor={`${baseId}-name`}>
                <Input
                    id={`${baseId}-name`}
                    required
                    fullWidth
                    value={draft.wadName}
                    onChange={event => update("wadName", event.target.value)}
                />
            </Field>

            <Field label="Level" htmlFor={`${baseId}-level`}>
                <Input
                    id={`${baseId}-level`}
                    required
                    fullWidth
                    value={draft.level}
                    onChange={event => update("level", event.target.value)}
                />
            </Field>

            <Field label="Map compatibility" htmlFor={`${baseId}-engine`}>
                <Select
                    id={`${baseId}-engine`}
                    value={String(draft.engine)}
                    onChange={event => update("engine", Number(event.target.value))}
                >
                    {DOOM_ENGINES.map(engine => (
                        <option key={engine.value} value={engine.value}>
                            {engine.label}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Submitter name" htmlFor={`${baseId}-submitter`}>
                <Input
                    id={`${baseId}-submitter`}
                    fullWidth
                    placeholder="anonymous"
                    value={draft.authorName}
                    onChange={event => update("authorName", event.target.value)}
                />
            </Field>

            <ErrorBanner message={error} />

            <FormActions>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                    Save changes
                </Button>
            </FormActions>
        </form>
    );
}

export function ModifySubmissionModal({ submissionId, onClose }: ModifySubmissionModalProps) {
    return (
        <Modal isOpen={submissionId !== null} onClose={onClose} title="Modify submission">
            {submissionId !== null && (
                <ModifySubmissionForm key={submissionId} submissionId={submissionId} onClose={onClose} />
            )}
        </Modal>
    );
}
