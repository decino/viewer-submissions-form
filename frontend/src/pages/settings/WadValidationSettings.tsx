import { Button } from "../../components/Button/Button";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Input } from "../../components/Input/Input";
import { Panel } from "../../components/Panel/Panel";
import { SuccessMessage } from "../../components/SuccessMessage/SuccessMessage";
import { ToggleSwitch } from "../../components/ToggleSwitch/ToggleSwitch";
import { useWadValidationForm, type ValidationSection } from "../../hooks/useWadValidationForm";
import styles from "./WadValidationSettings.module.css";

type SectionCopy = {
    id: ValidationSection;
    title: string;
    note: string;
};

const SECTIONS: readonly SectionCopy[] = [
    { id: "files", title: "Files", note: "Checked when someone uploads" },
    { id: "zips", title: "Files inside zips", note: "Checked for each file inside a zip or pk3" },
];

export function WadValidationSettings() {
    const form = useWadValidationForm();
    const { rows } = form;

    return (
        <form className={styles.form} noValidate onSubmit={form.save}>
            <div className={styles.intro}>
                <h1 className={styles.title}>WAD validation</h1>
                <p>
                    An upload must use one of these extensions. When a row has a header, the file must also start with
                    it. Leave the header empty to skip that check.
                </p>
            </div>

            {form.loading && <div className="loading">Loading the validation rules...</div>}

            <ErrorBanner message={form.loadError} />

            {rows &&
                SECTIONS.map(section => {
                    const sectionRows = rows[section.id];

                    return (
                        <Panel
                            key={section.id}
                            title={section.title}
                            aria-label={section.title}
                            actions={<span className={styles.note}>{section.note}</span>}
                        >
                            <div className={styles.well}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th scope="col" className={styles.extension}>
                                                Extension
                                            </th>
                                            <th scope="col">Header</th>
                                            <th scope="col" className={styles.zip}>
                                                Zip
                                            </th>
                                            <th scope="col" className={styles.remove}>
                                                <span className={styles.hidden}>Remove</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sectionRows.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className={styles.empty}>
                                                    No extensions yet, so any file type is accepted.
                                                </td>
                                            </tr>
                                        )}
                                        {sectionRows.map((row, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Input
                                                        aria-label="Extension"
                                                        fullWidth
                                                        required
                                                        value={row.extension}
                                                        onChange={event =>
                                                            form.updateRow(section.id, index, {
                                                                extension: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        aria-label="Header"
                                                        fullWidth
                                                        placeholder="No header check"
                                                        value={row.header}
                                                        disabled={row.zip}
                                                        onChange={event =>
                                                            form.updateRow(section.id, index, {
                                                                header: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <ToggleSwitch
                                                        label="Zip"
                                                        enabled={row.zip}
                                                        onChange={zip => form.toggleZip(section.id, index, zip)}
                                                    />
                                                </td>
                                                <td>
                                                    <Button
                                                        type="button"
                                                        size="small"
                                                        variant="danger"
                                                        aria-label="Remove"
                                                        onClick={() => form.removeRow(section.id, index)}
                                                    >
                                                        {"✕"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.add}>
                                <Button type="button" size="small" onClick={() => form.addRow(section.id)}>
                                    Add extension
                                </Button>
                            </div>
                        </Panel>
                    );
                })}

            <ErrorBanner message={form.error} />

            {form.saved && <SuccessMessage>Validation rules saved.</SuccessMessage>}

            {rows && (
                <div className={styles.footer}>
                    {form.dirty && <span className={styles.unsaved}>Unsaved changes</span>}
                    <Button type="button" disabled={!form.dirty} onClick={form.reset}>
                        Discard
                    </Button>
                    <Button type="submit" variant="primary" disabled={form.saving}>
                        Save rules
                    </Button>
                </div>
            )}
        </form>
    );
}
