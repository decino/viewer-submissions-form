import { Link, NavLink, useLocation } from "react-router";
import { useLogout } from "../../../hooks/mutations/auth";
import { Button } from "../../Button/Button";
import styles from "./Header.module.css";

export function Header() {
    const { pathname } = useLocation();
    const logoutUser = useLogout();
    const admin = pathname.startsWith("/admin");

    return (
        <header className={styles.header}>
            <Link to={admin ? "/admin" : "/"} className={styles.brand}>
                <span className={styles.title}>Viewer Submissions</span>
                <span className={styles.subtitle}>{admin ? "Admin" : "decino.nl"}</span>
            </Link>

            {admin ? (
                <nav aria-label="Admin" className={styles.nav}>
                    <NavLink to="/admin" end className={styles.item}>
                        <span className={styles.label}>Round</span>
                    </NavLink>
                    <NavLink to="/admin/settings" className={styles.item}>
                        <span className={styles.label}>Settings</span>
                    </NavLink>
                    <Button type="button" className={`${styles.item} ${styles.action}`} onClick={logoutUser}>
                        <span className={styles.label}>Log out</span>
                    </Button>
                </nav>
            ) : (
                <nav aria-label="Main" className={styles.nav}>
                    <NavLink to="/" end className={styles.item}>
                        <span className={styles.label}>This round</span>
                    </NavLink>
                    <NavLink to="/past-rounds" className={styles.item}>
                        <span className={styles.label}>Past rounds</span>
                    </NavLink>
                </nav>
            )}
        </header>
    );
}
