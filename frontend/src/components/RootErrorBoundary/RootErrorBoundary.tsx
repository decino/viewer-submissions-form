import { Component, type ReactNode } from "react";
import { Button } from "../Button/Button";
import styles from "./RootErrorBoundary.module.css";

interface RootErrorBoundaryProps {
    children: ReactNode;
}

interface RootErrorBoundaryState {
    failed: boolean;
    detail: string;
}

const INTACT: RootErrorBoundaryState = { failed: false, detail: "" };

function detailOf(error: unknown): string {
    if (error instanceof Error) {
        return error.message === "" ? error.name : `${error.name}: ${error.message}`;
    }

    if (typeof error === "string") {
        return error;
    }

    return "";
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
    state: RootErrorBoundaryState = INTACT;

    static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
        return { failed: true, detail: detailOf(error) };
    }

    handleRetry = (): void => {
        this.setState(INTACT);
    };

    render(): ReactNode {
        if (!this.state.failed) {
            return this.props.children;
        }

        return (
            <div className={styles.page}>
                <div className={styles.card} role="alert">
                    <h1 className={styles.title}>This page crashed</h1>
                    <p className={styles.blurb}>
                        Something went wrong while drawing the page. Try again first; reload only if it doesn't come
                        back.
                    </p>
                    {this.state.detail !== "" && <p className={styles.detail}>{this.state.detail}</p>}
                    <div className={styles.actions}>
                        <Button type="button" variant="primary" onClick={this.handleRetry}>
                            Try again
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                window.location.reload();
                            }}
                        >
                            Reload the page
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
