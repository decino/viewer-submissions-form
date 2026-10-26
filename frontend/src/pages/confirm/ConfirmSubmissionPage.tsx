import { Link, useSearchParams } from "react-router";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { useSubmissionConfirmation } from "../../hooks/queries/submission";
import { usePageTitle } from "../../hooks/usePageTitle";
import styles from "./ConfirmSubmissionPage.module.css";

export function ConfirmSubmissionPage() {
    usePageTitle("Confirm submission");
    const [params] = useSearchParams();
    const uid = params.get("uid") || null;
    const { result, error } = useSubmissionConfirmation(uid);

    const backLink = (
        <Link to="/" className={styles.cta}>
            Back to the current round
        </Link>
    );

    if (uid === null) {
        return (
            <Panel title="Confirmation failed">
                <div className={styles.body}>
                    <p>This link is missing its confirmation code. Use the link from your email.</p>
                    {backLink}
                </div>
            </Panel>
        );
    }

    if (result) {
        return (
            <Panel title="Submission confirmed">
                <div className={styles.body}>
                    <p>{result.description}</p>
                    {backLink}
                </div>
            </Panel>
        );
    }

    if (error !== null) {
        return (
            <Panel title="Confirmation failed">
                <div className={styles.body}>
                    <ErrorBanner message={error} />
                    {backLink}
                </div>
            </Panel>
        );
    }

    return <div className="loading">Confirming your submission...</div>;
}
