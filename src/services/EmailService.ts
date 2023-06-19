import {Constant, Inject, Service} from "@tsed/di";
import {BeforeInit, Logger} from "@tsed/common";
import * as nodemailer from "nodemailer";
import {Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {Envelope} from "nodemailer/lib/mailer";

@Service()
export class EmailService implements BeforeInit {

    @Inject()
    private logger: Logger;

    private emailTransport: Transporter<SMTPTransport.SentMessageInfo>;

    @Constant("envs.SMTP_USER")
    private readonly smtpUser: string;

    @Constant("envs.SMTP_PASS")
    private readonly smtpPass: string;

    @Constant("envs.SMTP_PORT")
    private readonly smtpPort: string;

    @Constant("envs.SMTP_HOST")
    private readonly smtpHost: string;

    @Constant("envs.SMTP_SECURE")
    private readonly smtpSecure: string;

    @Constant("envs.SMTP_FROM")
    private readonly smtpFrom: string;

    @Constant("envs.REPLY_TO")
    private readonly smtpReplyTo: string;

    public async $beforeInit(): Promise<void> {
        const transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: Number.parseInt(this.smtpPort),
            secure: this.smtpSecure === "true",
            auth: {
                user: this.smtpUser,
                pass: this.smtpPass
            },
            tls: {
                rejectUnauthorized: false
            }
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
        this.emailTransport = transporter;
    }

    public async sendMail(body: string, to: string): Promise<string> {
        const env: Envelope = {
            from: this.smtpFrom,
            to
        };
        const sentMail = await this.emailTransport.sendMail({
            ...env,
            text: body,
            replyTo: this.smtpReplyTo,
            sender: this.smtpFrom,
            subject: "Viewer-Submitted Levels Confirmation"
        });
        this.logger.info(`send mail to: ${to}. mail transport id: ${sentMail.messageId}`);
        return sentMail.messageId;
    }
}
