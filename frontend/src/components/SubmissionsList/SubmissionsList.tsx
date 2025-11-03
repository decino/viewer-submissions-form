import { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks";
import type { SubmissionModel } from "../../types";
import styles from "./SubmissionsList.module.scss";

interface SubmissionsListProps {
    submissions: SubmissionModel[];
    isLive?: boolean;
}

export default function SubmissionsList({ submissions: initialSubmissions, isLive = false }: SubmissionsListProps) {
    const [submissions, setSubmissions] = useState<SubmissionModel[]>(initialSubmissions);
    const { isConnected, onSubmission, onDelete } = useWebSocket();

    useEffect(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    useEffect(() => {
        if (!isLive) {
            return;
        }

        const unsubSubmission = onSubmission?.((data: SubmissionModel) => {
            setSubmissions(prev => [...prev, data]);
        });

        const unsubDelete = onDelete?.((ids: number[]) => {
            setSubmissions(prev => prev.filter(sub => !ids.includes(sub.id!)));
        });

        return () => {
            unsubSubmission?.();
            unsubDelete?.();
        };
    }, [isLive, onSubmission, onDelete]);

    return (
        <>
            {isLive && (
                <div className={styles.statusBadge}>
                    <span className={`${styles.badge} ${isConnected ? styles.success : styles.danger}`}>
                        {isConnected ? "Live results" : "Not live results"}
                    </span>
                </div>
            )}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>WAD Name</th>
                        <th>Level</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((submission, index) => (
                        <tr key={submission.id || index} data-id={submission.id}>
                            <td>{index + 1}</td>
                            <td>
                                <u>
                                    <span>{submission.wadName}</span>
                                </u>
                            </td>
                            <td>{submission.wadLevel}</td>
                        </tr>
                    ))}
                    {submissions.length === 0 && (
                        <tr>
                            <td colSpan={3} className={styles.noData}>
                                No submissions yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}
