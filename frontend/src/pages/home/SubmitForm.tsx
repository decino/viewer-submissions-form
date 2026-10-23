import { useId, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Captcha } from "../../components/Captcha/Captcha";
import { ChoiceGroup } from "../../components/ChoiceGroup/ChoiceGroup";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Field } from "../../components/Field/Field";
import { FormStep } from "../../components/FormStep/FormStep";
import { Input } from "../../components/Input/Input";
import { Modal } from "../../components/Modal/Modal";
import { Panel } from "../../components/Panel/Panel";
import { PrivacyPolicy } from "../../components/PrivacyPolicy/PrivacyPolicy";
import { Select } from "../../components/Select/Select";
import { TextArea } from "../../components/TextArea/TextArea";
import { ToggleSwitch } from "../../components/ToggleSwitch/ToggleSwitch";
import type { SubmissionDraft } from "../../domain/submission/formData";
import { DOOM_ENGINES, GZ_ACTIONS, RECORDED_FORMATS, UZDOOM_ENGINE, YES_NO } from "../../domain/submission/labels";
import { useSubmitForm } from "../../hooks/useSubmitForm";
import styles from "./SubmitForm.module.css";

interface SubmitFormProps {
    paused: boolean;
}

const MODES: readonly { value: SubmissionDraft["mode"]; label: string }[] = [
    { value: "url", label: "Link" },
    { value: "upload", label: "Upload" },
];

export function SubmitForm({ paused }: SubmitFormProps) {
    const { fileInput, ...form } = useSubmitForm();
    const id = useId();
    const [policyOpen, setPolicyOpen] = useState(false);

    if (form.submitted) {
        return (
            <Panel title="Submit a WAD">
                <div className={styles.sent}>
                    <p className={styles.success} role="status">
                        <strong>Check your email.</strong> Click the link we sent to confirm your entry; it expires in
                        20 minutes.
                    </p>
                    <Button type="button" variant="primary" onClick={form.reset}>
                        Submit another
                    </Button>
                </div>
            </Panel>
        );
    }

    return (
        <Panel title="Submit a WAD">
            <div className={styles.cover}>
                {paused && (
                    <div className={styles.paused}>
                        <p className={styles.pausedText}>Submissions are paused</p>
                    </div>
                )}

                <form className={styles.form} aria-label="Submit a WAD" onSubmit={form.submit}>
                    <fieldset className={styles.fields} disabled={paused}>
                        <p className={styles.required}>Everything except your name and the notes is required.</p>

                        <FormStep number={1} title="The map">
                            <div className={styles.source}>
                                <ChoiceGroup
                                    legend="Link or upload"
                                    name={`${id}-mode`}
                                    choices={MODES}
                                    value={form.draft.mode}
                                    onChange={form.chooseMode}
                                />

                                <div className={styles.sourceField}>
                                    {form.draft.mode === "url" ? (
                                        <Field label="WAD download URL" htmlFor={`${id}-url`}>
                                            <Input
                                                id={`${id}-url`}
                                                type="url"
                                                required
                                                fullWidth
                                                value={form.draft.wadUrl}
                                                onChange={e => form.changeWadUrl(e.target.value)}
                                                onBlur={form.lookUpWadName}
                                            />
                                        </Field>
                                    ) : (
                                        <>
                                            <Field
                                                label="WAD file"
                                                htmlFor={`${id}-file`}
                                                hint={
                                                    form.upload.limitMb !== null &&
                                                    `Uploads are limited to ${form.upload.limitMb} MB`
                                                }
                                            >
                                                <Input
                                                    id={`${id}-file`}
                                                    type="file"
                                                    required
                                                    fullWidth
                                                    accept={form.upload.accept}
                                                    ref={fileInput}
                                                    onChange={form.chooseFile}
                                                />
                                            </Field>
                                            <ErrorBanner message={form.upload.error} />
                                            <ErrorBanner message={form.fileError} />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.grid}>
                                <Field label="WAD name" htmlFor={`${id}-name`}>
                                    <Input
                                        id={`${id}-name`}
                                        required
                                        fullWidth
                                        value={form.wadNameField.value}
                                        readOnly={form.wadNameField.readOnly}
                                        placeholder={form.wadNameField.placeholder}
                                        onChange={e => form.update("wadName", e.target.value)}
                                    />
                                </Field>

                                <Field
                                    label="Which level should I play?"
                                    htmlFor={`${id}-level`}
                                    hint={
                                        form.mapError &&
                                        `The maps in that file could not be read (${form.mapError}). Type the level instead.`
                                    }
                                >
                                    {form.mapNames.length > 0 ? (
                                        <Select
                                            id={`${id}-level`}
                                            required
                                            value={form.draft.level}
                                            onChange={e => form.update("level", e.target.value)}
                                        >
                                            {form.mapNames.map(mapName => (
                                                <option key={mapName} value={mapName}>
                                                    {mapName}
                                                </option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <Input
                                            id={`${id}-level`}
                                            required
                                            fullWidth
                                            value={form.draft.level}
                                            onChange={e => form.update("level", e.target.value)}
                                        />
                                    )}
                                </Field>

                                <Field label="Source port you played or tested it on" htmlFor={`${id}-port`}>
                                    <Input
                                        id={`${id}-port`}
                                        required
                                        fullWidth
                                        value={form.draft.playTestEngine}
                                        onChange={e => form.update("playTestEngine", e.target.value)}
                                    />
                                </Field>

                                <Field label="Map compatibility" htmlFor={`${id}-engine`}>
                                    <Select
                                        id={`${id}-engine`}
                                        value={String(form.draft.engine)}
                                        onChange={e => form.update("engine", Number(e.target.value))}
                                    >
                                        {DOOM_ENGINES.map(engine => (
                                            <option key={engine.value} value={engine.value}>
                                                {engine.label}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                            </div>

                            {form.draft.engine === UZDOOM_ENGINE && (
                                <fieldset className={styles.options}>
                                    <legend className={styles.optionsLegend}>
                                        If GZDoom/UZDoom is required, am I allowed to jump, crouch or mouse-look?
                                    </legend>
                                    <div className={styles.optionList}>
                                        {GZ_ACTIONS.map(action => (
                                            <ToggleSwitch
                                                key={action.value}
                                                label={action.label}
                                                enabled={form.draft.gzDoomActions.includes(action.value)}
                                                onChange={enabled => form.toggleGzAction(action.value, enabled)}
                                            />
                                        ))}
                                    </div>
                                </fieldset>
                            )}
                        </FormStep>

                        <FormStep number={2} title="How I should play it">
                            <ChoiceGroup
                                legend="Which recording format would you like?"
                                name={`${id}-format`}
                                choices={RECORDED_FORMATS}
                                value={form.draft.recordedFormat}
                                onChange={recordedFormat => form.update("recordedFormat", recordedFormat)}
                            />

                            <Field
                                label="Tell me something about the level"
                                htmlFor={`${id}-info`}
                                hint={
                                    <span id={`${id}-info-hint`}>
                                        Its backstory, your inspiration or something about yourself, whatever you want.
                                        Keep it fairly short, as I need to memorise it.
                                    </span>
                                }
                            >
                                <TextArea
                                    id={`${id}-info`}
                                    aria-describedby={`${id}-info-hint`}
                                    rows={4}
                                    maxLength={4096}
                                    value={form.draft.info}
                                    onChange={e => form.update("info", e.target.value)}
                                />
                            </Field>
                        </FormStep>

                        <FormStep number={3} title="About you">
                            <div className={styles.grid}>
                                <Field
                                    label="Your name"
                                    htmlFor={`${id}-submitter`}
                                    hint="Leave it empty to stay anonymous"
                                >
                                    <Input
                                        id={`${id}-submitter`}
                                        fullWidth
                                        placeholder="anonymous"
                                        value={form.draft.authorName}
                                        onChange={e => form.update("authorName", e.target.value)}
                                    />
                                </Field>

                                <Field label="Your email address (kept private)" htmlFor={`${id}-email`}>
                                    <Input
                                        id={`${id}-email`}
                                        type="email"
                                        required
                                        fullWidth
                                        autoComplete="email"
                                        placeholder="name@example.com"
                                        value={form.draft.email}
                                        onChange={e => form.update("email", e.target.value)}
                                    />
                                </Field>
                            </div>

                            <div className={styles.row}>
                                <ChoiceGroup
                                    legend="Did you make this level?"
                                    name={`${id}-author`}
                                    choices={YES_NO}
                                    value={form.draft.author}
                                    onChange={author => form.update("author", author)}
                                />

                                {form.draft.author && (
                                    <ChoiceGroup
                                        legend="If you made it and it isn't hosted publicly, may I share it with viewers?"
                                        name={`${id}-distributable`}
                                        choices={YES_NO}
                                        value={form.draft.distributable}
                                        onChange={distributable => form.update("distributable", distributable)}
                                    />
                                )}
                            </div>
                        </FormStep>

                        <div className={styles.footer}>
                            <p className={styles.legal}>
                                By submitting, you agree to the{" "}
                                <Button type="button" className={styles.linkButton} onClick={() => setPolicyOpen(true)}>
                                    Privacy Policy
                                </Button>
                                .
                            </p>

                            <div className={styles.send}>
                                <div className={styles.check}>
                                    <Captcha onToken={form.captcha.onToken} resetKey={form.captcha.resetKey} />
                                    <ErrorBanner message={form.captcha.error} />
                                </div>

                                {!paused && (
                                    <Button type="submit" variant="primary" disabled={!form.canSubmit}>
                                        {form.sending ? "Sending..." : "Submit WAD"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <ErrorBanner message={form.error} />
                    </fieldset>
                </form>
            </div>

            <Modal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} title="Privacy Policy">
                <PrivacyPolicy />
            </Modal>
        </Panel>
    );
}
