import { Link } from "react-router";
import { Panel } from "../../components/Panel/Panel";
import { usePageTitle } from "../../hooks/usePageTitle";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
    usePageTitle("Not found");

    return (
        <Panel title="This level doesn't exist">
            <div className={styles.body}>
                <p className={styles.code}>404</p>
                <p>The page you asked for isn't here. Check the address, or go back to the current round.</p>
                <Link to="/" className={styles.cta}>
                    Back to the current round
                </Link>
            </div>
        </Panel>
    );
}
