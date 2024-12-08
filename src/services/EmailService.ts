import { Constant, Inject, Service } from "@tsed/di";
import { AfterInit, Logger } from "@tsed/common";
import { SentMessageInfo } from "nodemailer/lib/smtp-transport";
import { Envelope } from "nodemailer/lib/mailer";
import GlobalEnv from "../model/constants/GlobalEnv.js";
import { createTestAccount, createTransport, Transporter } from "nodemailer";
import { isProduction } from "../config/envs/index.js";
import { BadRequest } from "@tsed/exceptions";
import EMAIL_TEMPLATE from "../model/constants/EmailTemplate.js";

@Service()
export class EmailService implements AfterInit {
    @Inject()
    private logger: Logger;

    private emailTransport: Transporter<SentMessageInfo>;

    @Constant(GlobalEnv.SMTP_USER)
    private readonly smtpUser: string;

    @Constant(GlobalEnv.SMTP_PASS)
    private readonly smtpPass: string;

    @Constant(GlobalEnv.SMTP_PORT)
    private readonly smtpPort: string;

    @Constant(GlobalEnv.SMTP_HOST)
    private readonly smtpHost: string;

    @Constant(GlobalEnv.SMTP_SECURE)
    private readonly smtpSecure: string;

    @Constant(GlobalEnv.SMTP_FROM)
    private readonly smtpFrom: string;

    @Constant(GlobalEnv.REPLY_TO)
    private readonly smtpReplyTo: string;

    private readonly emailTemplateMapping: Record<EMAIL_TEMPLATE, { subject: string; body?: string }> = {
        [EMAIL_TEMPLATE.DELETED]: {
            body: "Your submission has been rejected, please submit a different WAD or level",
            subject: "Submission rejected",
        },
        [EMAIL_TEMPLATE.REJECTED]: {
            subject: "Submission rejected",
        },
        [EMAIL_TEMPLATE.NEW_SUBMISSION]: {
            subject: "Viewer-Submitted Levels Confirmation",
        },
    };

    public async $afterInit(): Promise<void> {
        this.emailTransport = await this.getTransport();
    }

    public async sendMail(to: string, template: EMAIL_TEMPLATE, body?: string): Promise<SentMessageInfo> {
        const env: Envelope = {
            from: this.smtpFrom,
            to,
        };
        const mapping = this.emailTemplateMapping[template];
        if (!mapping.body && !body) {
            throw new Error("Unable to send email with no body");
        }

        const sentMail = await this.emailTransport.sendMail({
            ...env,
            text: body ?? mapping.body,
            replyTo: this.smtpReplyTo,
            sender: this.smtpFrom,
            subject: mapping.subject,
        });
        this.logger.info(`send mail to: ${to}. mail transport id: ${sentMail.messageId}`);
        if (!this.wasAccepted(sentMail, to)) {
            throw new BadRequest(`Unable to send an email to ${to}`);
        }
        return sentMail;
    }

    private async getTransport(): Promise<Transporter<SentMessageInfo>> {
        if (isProduction) {
            const transporter = createTransport({
                host: this.smtpHost,
                port: Number.parseInt(this.smtpPort),
                secure: this.smtpSecure === "true",
                auth: {
                    user: this.smtpUser,
                    pass: this.smtpPass,
                },
                debug: !isProduction,
                tls: {
                    rejectUnauthorized: false,
                },
            });
            if (!this.smtpHost) {
                throw new Error("No SMTP server has been defined.");
            }
            try {
                await transporter.verify();
            } catch (e) {
                this.logger.error(`Unable to connect to SMTP server: ${this.smtpHost}`);
                throw new Error(e);
            }
            this.logger.info(`Connected to SMTP server: ${this.smtpHost}:${this.smtpPort}`);
            return transporter;
        }
        return new Promise((resolve, reject) => {
            createTestAccount((err, account) => {
                if (err) {
                    reject(err);
                }
                const transporter = createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: account.user,
                        pass: account.pass,
                    },
                });
                this.logger.info(`Connected to fake SMTP server: smtp.ethereal.email:587`);
                this.logger.info(
                    `email credentials for https://ethereal.email/login username: "${account.user}" password: "${account.pass}" `,
                );
                resolve(transporter);
            });
        });
    }

    private wasAccepted(sentMail: SentMessageInfo, emailSentTo: string): boolean {
        const acceptedArr = sentMail.accepted;
        for (const accepted of acceptedArr) {
            if (typeof accepted === "string") {
                if (accepted === emailSentTo) {
                    return true;
                }
            } else {
                if (accepted.address === emailSentTo) {
                    return true;
                }
            }
        }
        return false;
    }
}
