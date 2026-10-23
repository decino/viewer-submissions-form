import { useId } from "react";
import { Button } from "../../components/Button/Button";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormActions } from "../../components/FormActions/FormActions";
import { Input } from "../../components/Input/Input";
import { Modal } from "../../components/Modal/Modal";
import { useYoutubeLinkForm } from "../../hooks/useYoutubeLinkForm";
import type { AdminSubmission } from "../../types/api";
import styles from "./YoutubeLinkModal.module.css";

interface YoutubeLinkModalProps {
    submission: AdminSubmission | null;
    onClose: () => void;
}

interface YoutubeLinkFormProps {
    submission: AdminSubmission;
    onClose: () => void;
}

function YoutubeLinkForm({ submission, onClose }: YoutubeLinkFormProps) {
    const { prefix, path, setPath, removing, error, saving, submit } = useYoutubeLinkForm(submission, onClose);
    const baseId = useId();

    return (
        <form className={styles.form} onSubmit={submit}>
            <p className={styles.intro}>
                Add the playthrough of {submission.WADName} once the video is published. Leave it empty to remove the
                link.
            </p>

            <Field label="Video address" htmlFor={`${baseId}-path`}>
                <div className={styles.prefixed}>
                    <span id={`${baseId}-prefix`} className={styles.prefix}>
                        {prefix}
                    </span>
                    <Input
                        id={`${baseId}-path`}
                        className={styles.input}
                        aria-describedby={`${baseId}-prefix`}
                        placeholder="watch?v=t7BW5ZiTmrE"
                        value={path}
                        onChange={event => setPath(event.target.value)}
                    />
                </div>
            </Field>

            <ErrorBanner message={error} />

            <FormActions>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                    {removing ? "Remove link" : "Save link"}
                </Button>
            </FormActions>
        </form>
    );
}

export function YoutubeLinkModal({ submission, onClose }: YoutubeLinkModalProps) {
    return (
        <Modal isOpen={submission !== null} onClose={onClose} title="Set YouTube link">
            {submission && <YoutubeLinkForm key={submission.id} submission={submission} onClose={onClose} />}
        </Modal>
    );
}
