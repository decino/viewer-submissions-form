import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { Choice } from "../../components/Choice/Choice";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormActions } from "../../components/FormActions/FormActions";
import { Modal } from "../../components/Modal/Modal";
import { Select } from "../../components/Select/Select";
import { TextArea } from "../../components/TextArea/TextArea";
import { STATUS_OPTIONS } from "../../domain/submission/labels";
import { useChangeStatusForm } from "../../hooks/useChangeStatusForm";
import type { AdminSubmission } from "../../types/api";
import styles from "./ChangeStatusModal.module.css";

interface ChangeStatusModalProps {
    submission: AdminSubmission | null;
    onClose: () => void;
}

interface ChangeStatusFormProps {
    submission: AdminSubmission;
    onClose: () => void;
}

function ChangeStatusForm({ submission, onClose }: ChangeStatusFormProps) {
    const {
        status,
        chooseStatus,
        comments,
        setComments,
        canPickAnother,
        pickAnother,
        setPickAnother,
        error,
        saving,
        submit,
    } = useChangeStatusForm(submission, onClose);
    const baseId = useId();

    return (
        <form className={styles.form} onSubmit={submit}>
            <Field label="Status" htmlFor={`${baseId}-status`}>
                <Select id={`${baseId}-status`} value={status} onChange={event => chooseStatus(event.target.value)}>
                    {STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </Select>
            </Field>

            <Field label="Comments" htmlFor={`${baseId}-comments`}>
                <TextArea
                    id={`${baseId}-comments`}
                    rows={3}
                    value={comments}
                    onChange={event => setComments(event.target.value)}
                />
            </Field>

            {canPickAnother && (
                <Choice
                    label="Pick another random entry for this round"
                    checked={pickAnother}
                    onChange={setPickAnother}
                />
            )}

            <ErrorBanner message={error} />

            <FormActions>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                    Change status
                </Button>
            </FormActions>
        </form>
    );
}

export function ChangeStatusModal({ submission, onClose }: ChangeStatusModalProps) {
    return (
        <Modal isOpen={submission !== null} onClose={onClose} title="Change status">
            {submission && <ChangeStatusForm key={submission.id} submission={submission} onClose={onClose} />}
        </Modal>
    );
}
