import { NavLink, useParams } from "react-router";
import { Panel } from "../../components/Panel/Panel";
import { usePageTitle } from "../../hooks/usePageTitle";
import { AccountSettings } from "./AccountSettings";
import { WadValidationSettings } from "./WadValidationSettings";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
    const { section } = useParams();
    const account = section === "account";
    usePageTitle(account ? "Your account" : "WAD validation");

    return (
        <div className={styles.page}>
            <Panel title="Settings" className={styles.menu}>
                <nav aria-label="Settings">
                    <ul className={styles.links}>
                        <li>
                            <NavLink to="/admin/settings" end className={styles.link}>
                                WAD validation
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/settings/account" className={styles.link}>
                                Your account
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </Panel>

            <div className={styles.content}>{account ? <AccountSettings /> : <WadValidationSettings />}</div>
        </div>
    );
}
