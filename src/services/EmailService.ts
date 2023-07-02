import {Constant, Inject, Service} from "@tsed/di";
import {BeforeInit, Logger} from "@tsed/common";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {Envelope} from "nodemailer/lib/mailer";
import GlobalEnv from "../model/constants/GlobalEnv";
import {createTransport, Transporter} from "nodemailer";
import {isProduction} from "../config/envs";

@Service()
export class EmailService implements BeforeInit {

    @Inject()
    private logger: Logger;

    private emailTransport: Transporter<SMTPTransport.SentMessageInfo>;

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

    public async $beforeInit(): Promise<void> {
        const transporter = createTransport({
            host: this.smtpHost,
            port: Number.parseInt(this.smtpPort),
            secure: this.smtpSecure === "true",
            auth: {
                user: this.smtpUser,
                pass: this.smtpPass
            },
            debug: !isProduction,
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
