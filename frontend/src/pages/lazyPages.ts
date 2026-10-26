import { type ComponentType, lazy } from "react";

// oxlint-disable-next-line typescript/no-explicit-any
function named<T extends ComponentType<any>, K extends string>(loader: () => Promise<Record<K, T>>, name: K) {
    return lazy(() => loader().then(m => ({ default: m[name] })));
}

export const PastRoundsPage = named(() => import("./pastRounds/PastRoundsPage"), "PastRoundsPage");
export const LoginPage = named(() => import("./login/LoginPage"), "LoginPage");
export const ConfirmSubmissionPage = named(() => import("./confirm/ConfirmSubmissionPage"), "ConfirmSubmissionPage");
export const AdminPage = named(() => import("./admin/AdminPage"), "AdminPage");
export const SettingsPage = named(() => import("./settings/SettingsPage"), "SettingsPage");
export const NotFoundPage = named(() => import("./notfound/NotFoundPage"), "NotFoundPage");
