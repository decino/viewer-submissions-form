import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useSubmissionForm } from "../../hooks";
import * as submissionApi from "../../utils/api/submissionApi";
import Alert from "../Alert/Alert";
import type { SubmissionModel } from "../../types";
import styles from "./SubmissionForm.module.scss";

interface SubmissionFormProps {
    doomEngines: Record<string, string>;
    gzActions: Record<string, string>;
    allowedUploadExtensions: string;
    isAdmin?: boolean;
    isPaused?: boolean;
}

const engineMap: Record<string, string> = {
    UNKNOWN: "I don't know",
    NA: "N/A",
    GZDoom: "GZDoom",
    Doom: "Ultimate Doom",
    DoomII: "Doom II",
    FINAL_DOOM: "Final Doom",
    BOOM: "Boom",
    MBF: "MBF",
    DOOM_64: "Doom 64",
};

const gzActionMap: Record<string, string> = {
    JUMP: "Jump",
    CROUCH: "Crouch",
    MOUSE_LOOK: "Mouse look",
};

export default function SubmissionForm({
    doomEngines,
    gzActions,
    allowedUploadExtensions,
    isAdmin = false,
    isPaused = false,
}: SubmissionFormProps) {
    const [uploadMode, setUploadMode] = useState<"url" | "upload">("url");
    const [isAuthor, setIsAuthor] = useState(false);
    const [selectedEngine, setSelectedEngine] = useState("");
    const [showGzActions, setShowGzActions] = useState(false);
    const [wadFile, setWadFile] = useState<File | null>(null);
    const [fileSizeError, setFileSizeError] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);
    const fileSizeLimit = parseInt(import.meta.env.VITE_FILE_SIZE_LIMIT_MB || "50") * 1024 * 1024;

    const { loading, error, success, submitForm, setError } = useSubmissionForm();

    useEffect(() => {
        const engineValue = Object.keys(doomEngines).find(key => key === selectedEngine);
        if (engineValue) {
            const engineName = doomEngines[engineValue];
            setShowGzActions(engineName === "GZDoom");
        }
    }, [selectedEngine, doomEngines]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > fileSizeLimit) {
            setFileSizeError(true);
            setWadFile(null);
            e.target.value = "";
            return;
        }

        setFileSizeError(false);
        setWadFile(file);
    };

    const handleUrlChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        if (!url) {
            return;
        }

        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("doomworld.com") && urlObj.pathname.includes("idgames")) {
                const html = await submissionApi.getCorsProxy(url);

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const wadName =
                    doc
                        .getElementsByClassName("filelist")[0]
                        ?.querySelector("tbody > tr > td:nth-child(2)")
                        ?.textContent?.trim() || null;

                if (wadName) {
                    const wadNameInput = document.getElementById("wadName") as HTMLInputElement;
                    if (wadNameInput) {
                        wadNameInput.value = wadName;
                        wadNameInput.setAttribute("disabled", "true");
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching WAD info:", err);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (isPaused) {
            setError("Submissions are currently paused");
            return;
        }

        const formData = new FormData(formRef.current!);

        const submission: SubmissionModel = {
            wadName: formData.get("wadName") as string,
            wadUrl: uploadMode === "url" ? (formData.get("wadUrl") as string) : undefined,
            wadLevel: formData.get("level") as string,
            playTestEngine: formData.get("playTestEngine") as string,
            engine: formData.get("engine") as string,
            authorName: (formData.get("authorName") as string) || undefined,
            author: formData.get("author") === "true",
            distributable: formData.get("distributable") === "true" || undefined,
            info: (formData.get("info") as string) || undefined,
            email: (formData.get("email") as string) || undefined,
            recordedFormat: formData.get("recordedFormat") as "Blind" | "Practised",
        };

        if (showGzActions) {
            const gzDoomActions: string[] = [];
            formData.getAll("gzDoomAction").forEach(action => {
                gzDoomActions.push(action as string);
            });
            if (gzDoomActions.length > 0) {
                submission.gzDoomAction = gzDoomActions;
            }
        }

        await submitForm(submission, uploadMode === "upload" ? wadFile || undefined : undefined);

        if (success) {
            formRef.current?.reset();
            setWadFile(null);
        }
    };

    const engineOptions = Object.keys(doomEngines).map(key => ({
        value: key,
        label: engineMap[doomEngines[key]] || doomEngines[key],
        dataValue: doomEngines[key],
    }));

    const gzActionOptions = Object.keys(gzActions).map(key => ({
        value: key,
        label: gzActionMap[gzActions[key]] || gzActions[key],
    }));

    return (
        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
            {!isAdmin && (
                <div className={styles.field}>
                    <label className={styles.label}>Post a link to the WAD below, or you can upload it.</label>
                    <div className={styles.radioGroup}>
                        <label className={styles.radio}>
                            <input
                                type="radio"
                                name="uploadOrUrl"
                                value="url"
                                checked={uploadMode === "url"}
                                onChange={() => setUploadMode("url")}
                            />
                            <span>Link</span>
                        </label>
                        <label className={styles.radio}>
                            <input
                                type="radio"
                                name="uploadOrUrl"
                                value="upload"
                                checked={uploadMode === "upload"}
                                onChange={() => setUploadMode("upload")}
                            />
                            <span>Upload</span>
                        </label>
                    </div>
                </div>
            )}

            {uploadMode === "url" ? (
                <div className={styles.field}>
                    <label className={styles.label}>
                        Wad Download URL <span className={styles.required}>*</span>
                    </label>
                    <input type="url" className={styles.input} name="wadUrl" required onChange={handleUrlChange} />
                </div>
            ) : (
                <div className={styles.field}>
                    <label className={styles.label}>
                        Upload WAD <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="file"
                        className={styles.input}
                        name="file"
                        accept={allowedUploadExtensions}
                        onChange={handleFileChange}
                    />
                    {fileSizeError && <Alert type="danger">File is too big</Alert>}
                    <Alert type="warning">
                        A max file size of {Math.floor(fileSizeLimit / (1024 * 1024))}MB is set for uploaded files
                    </Alert>
                </div>
            )}

            <div className={styles.field}>
                <label className={styles.label}>
                    Name of the WAD <span className={styles.required}>*</span>
                </label>
                <input type="text" className={styles.input} id="wadName" name="wadName" required />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    Which level should I play? <span className={styles.required}>*</span>
                </label>
                <input type="text" className={styles.input} name="level" required />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    What source port did you play or test this map on? <span className={styles.required}>*</span>
                </label>
                <input type="text" className={styles.input} name="playTestEngine" required />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    Map compatibility <span className={styles.required}>*</span>
                </label>
                <select
                    name="engine"
                    className={styles.select}
                    required
                    onChange={e => setSelectedEngine(e.target.value)}
                >
                    {engineOptions.map(option => (
                        <option key={option.value} value={option.value} data-value={option.dataValue}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {showGzActions && !isAdmin && (
                <div className={styles.field}>
                    <label className={styles.label}>
                        If GZDoom is required, am I allowed to jump, crouch, or mouse-look?
                    </label>
                    <div className={styles.checkboxGroup}>
                        {gzActionOptions.map(option => (
                            <label key={option.value} className={styles.checkbox}>
                                <input type="checkbox" name="gzDoomAction" value={option.value} />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.field}>
                <label className={styles.label}>
                    Under what name would you like to submit? Leave the field empty to remain anonymous.
                </label>
                <input type="text" className={styles.input} name="authorName" placeholder="anonymous" />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    Did you make this level? <span className={styles.required}>*</span>
                </label>
                <div className={styles.radioGroup}>
                    <label className={styles.radio}>
                        <input type="radio" name="author" value="true" onChange={() => setIsAuthor(true)} />
                        <span>Yes</span>
                    </label>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="author"
                            value="false"
                            defaultChecked
                            onChange={() => setIsAuthor(false)}
                        />
                        <span>No</span>
                    </label>
                </div>
            </div>

            {isAuthor && (
                <div className={styles.field}>
                    <label className={styles.label}>
                        If you've made the WAD, and it's not hosted or available publicly, am I allowed to provide it to
                        the viewers?
                    </label>
                    <div className={styles.radioGroup}>
                        <label className={styles.radio}>
                            <input type="radio" name="distributable" value="true" />
                            <span>Yes</span>
                        </label>
                        <label className={styles.radio}>
                            <input type="radio" name="distributable" value="false" defaultChecked />
                            <span>No</span>
                        </label>
                    </div>
                </div>
            )}

            {!isAdmin && (
                <div className={styles.field}>
                    <label className={styles.label}>
                        Tell me something about the level: its backstory, your inspiration, or about yourself --
                        whatever you want. Keep it somewhat short as I need to memorise it.
                    </label>
                    <textarea className={styles.textarea} name="info" rows={3} maxLength={4096} />
                </div>
            )}

            {!isAdmin && (
                <div className={styles.field}>
                    <label className={styles.label}>
                        Your email address (will be kept private) <span className={styles.required}>*</span>
                    </label>
                    <input type="email" className={styles.input} name="email" placeholder="name@example.com" required />
                </div>
            )}

            <div className={styles.field}>
                <label className={styles.label}>
                    Which recording format would you like? <span className={styles.required}>*</span>
                </label>
                <div className={styles.radioGroup}>
                    <label className={styles.radio}>
                        <input type="radio" name="recordedFormat" value="Blind" />
                        <span>Blind</span>
                    </label>
                    <label className={styles.radio}>
                        <input type="radio" name="recordedFormat" value="Practised" defaultChecked />
                        <span>Practised</span>
                    </label>
                </div>
            </div>

            {error && <Alert type="danger">{error}</Alert>}

            {success && (
                <Alert type="success">
                    An email has been sent to the address provided. Please click the link in your email to confirm your
                    entry. <strong>NOTE:</strong> this link will expire in 20 minutes.
                </Alert>
            )}

            {!isAdmin && !isPaused && (
                <div className={styles.submitContainer}>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? "Loading..." : "Submit"}
                    </button>
                </div>
            )}
        </form>
    );
}
