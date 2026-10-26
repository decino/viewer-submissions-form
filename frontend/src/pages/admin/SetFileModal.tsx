import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormActions } from "../../components/FormActions/FormActions";
import { Input } from "../../components/Input/Input";
import { Modal } from "../../components/Modal/Modal";
import { SuccessMessage } from "../../components/SuccessMessage/SuccessMessage";
import { useSetFileForm } from "../../hooks/useSetFileForm";
import type { AdminSubmission } from "../../types/api";
import styles from "./SetFileModal.module.css";

interface SetFileModalProps {
    submission: AdminSubmission | null;
    onClose: () => void;
}

interface SetFileFlowProps {
    submission: AdminSubmission;
    onClose: () => void;
}

function SetFileFlow({ submission, onClose }: SetFileFlowProps) {
    const { needsConfirmation, confirmReplace, accept, configError, chooseFile, canUpload, error, replaced, submit } =
        useSetFileForm(submission);
    const fileId = useId();

    if (needsConfirmation) {
        return (
            <ConfirmDialog
                open
                title="Replace the WAD URL"
                body="This entry links to a WAD URL. Replace it with an uploaded file?"
                confirmLabel="Upload a file"
                onConfirm={confirmReplace}
                onCancel={onClose}
            />
        );
    }

    return (
        <Modal isOpen onClose={onClose} title="Set file">
            <form className={styles.form} onSubmit={submit}>
                <ErrorBanner message={configError} />

                <Field label={`WAD file for ${submission.WADName}`} htmlFor={fileId}>
                    <Input
                        id={fileId}
                        type="file"
                        fullWidth
                        accept={accept}
                        onChange={event => chooseFile(event.target.files?.[0] ?? null)}
                    />
                </Field>

                <ErrorBanner message={error} />

                {replaced && <SuccessMessage>File replaced.</SuccessMessage>}

                <FormActions>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {replaced ? "Done" : "Cancel"}
                    </Button>
                    <Button type="submit" variant="primary" disabled={!canUpload}>
                        Upload file
                    </Button>
                </FormActions>
            </form>
        </Modal>
    );
}

export function SetFileModal({ submission, onClose }: SetFileModalProps) {
    if (!submission) {
        return null;
    }

    return <SetFileFlow key={submission.id} submission={submission} onClose={onClose} />;
}
