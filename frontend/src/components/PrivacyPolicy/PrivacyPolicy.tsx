import styles from "./PrivacyPolicy.module.css";

interface PolicyPoint {
    title?: string;
    text?: string;
    items?: readonly string[];
}

interface PolicySection {
    title: string;
    intro?: string;
    points: readonly PolicyPoint[];
}

const SECTIONS: readonly PolicySection[] = [
    {
        title: "Key points",
        intro: "We value your privacy and want to be clear about how we handle your information:",
        points: [
            {
                title: "Data collection",
                text: "We collect essential information needed for submissions.decino.nl to operate, including submission details and contact information.",
            },
            {
                title: "Data usage",
                text: "Your information helps us process submissions, communicate with you and maintain service security.",
            },
            {
                title: "Your rights",
                text: "You have full control over your data and can exercise your privacy rights at any time.",
            },
        ],
    },
    {
        title: "Information we collect",
        points: [
            {
                title: "Submission information",
                items: [
                    "WAD files and download URLs",
                    "Level names and specifications",
                    "Author information (if provided)",
                    "Email addresses for communication",
                    "Technical details about submissions",
                ],
            },
            {
                title: "Technical data",
                items: [
                    "Browser type and version",
                    "Access times and dates",
                    "Pages visited on our website",
                    "Technical information necessary for service delivery",
                ],
            },
        ],
    },
    {
        title: "How we use your information",
        points: [
            {
                title: "Primary uses",
                items: [
                    "Processing and managing your submissions",
                    "Communicating about submission status",
                    "Improving our services and user experience",
                    "Maintaining service security and preventing abuse",
                    "Complying with legal obligations",
                ],
            },
        ],
    },
    {
        title: "Data sharing and security",
        points: [
            {
                title: "Information sharing",
                text: "We do not sell or share your personal information with third parties except:",
                items: ["When required by law", "To protect our rights and property", "With your explicit consent"],
            },
            {
                title: "Security measures",
                text: "We implement appropriate technical and organisational security measures to protect your data. However, no electronic transmission is 100% secure, and we cannot guarantee absolute security.",
            },
        ],
    },
    {
        title: "Your privacy rights",
        points: [
            {
                title: "Your rights include",
                items: [
                    "Access to your personal data",
                    "Correction of inaccurate data",
                    "Deletion of your data (where applicable)",
                    "Objection to data processing",
                    "Data portability",
                ],
            },
        ],
    },
    {
        title: "Retention period",
        points: [
            {
                text: "We retain your personal information only for as long as necessary to fulfil the purposes outlined in this privacy policy, unless a longer retention period is required by law.",
            },
        ],
    },
    {
        title: "Changes to this policy",
        points: [
            {
                text: 'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.',
            },
        ],
    },
];

export function PrivacyPolicy() {
    return (
        <article className={styles.policy}>
            <p className={styles.updated}>Last updated: 9 September 2023</p>

            {SECTIONS.map(section => (
                <section key={section.title} className={styles.section}>
                    <h3 className={styles.sectionTitle}>{section.title}</h3>
                    {section.intro && <p>{section.intro}</p>}
                    {section.points.map(point => (
                        <div key={point.title ?? point.text} className={styles.point}>
                            {point.title && <h4 className={styles.pointTitle}>{point.title}</h4>}
                            {point.text && <p>{point.text}</p>}
                            {point.items && (
                                <ul className={styles.list}>
                                    {point.items.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </section>
            ))}

            <section className={styles.contact}>
                <h3 className={styles.sectionTitle}>Contact us</h3>
                <p>If you have any questions about this privacy policy or our practices, please contact us:</p>
                <ul className={styles.list}>
                    <li>
                        Email: <a href="mailto:submissions@decino.nl">submissions@decino.nl</a>
                    </li>
                    <li>
                        Website: <a href="https://submissions.decino.nl">submissions.decino.nl</a>
                    </li>
                </ul>
            </section>
        </article>
    );
}
