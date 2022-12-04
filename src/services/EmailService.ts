import {Inject, Service} from "@tsed/di";
import {BeforeInit, Logger} from "@tsed/common";
import * as nodemailer from "nodemailer";
import {Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {Envelope} from "nodemailer/lib/mailer";
import {PendingEntryConfirmationModel} from "../model/db/PendingEntryConfirmation.model";
import * as process from "process";

@Service()
export class EmailService implements BeforeInit {

    @Inject()
    private logger: Logger;

    private emailTransport: Transporter<SMTPTransport.SentMessageInfo>;

    public async $beforeInit(): Promise<void> {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number.parseInt(process.env.SMTP_PORT as string),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        if (!process.env.SMTP_HOST) {
            throw new Error("No SMTP server has been defined");
        }
        if (!process.env.BASE_URL) {
            throw new Error("Base URL has not been set");
        }
        try {
            await transporter.verify();
        } catch (e) {
            this.logger.error(`Unable to connect to SMTP server: ${process.env.SMTP_HOST}`);
            throw new Error(e);
        }
        this.logger.info(`Connected to SMTP server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        this.emailTransport = transporter;
    }

    public async sendConfirmationEmail(pendingEntry: PendingEntryConfirmationModel): Promise<string> {
        const baseUrl = process.env.BASE_URL;
        const confirmationUrl = `${baseUrl}/rest/submissionConformation?uid=${pendingEntry.confirmationUid}`;
        const env: Envelope = {
            from: process.env.SMTP_FROM,
            to: pendingEntry.submitterEmail,
        };
        const sentMail = await this.emailTransport.sendMail({
            ...env,
            text: confirmationUrl
        });
        this.logger.info(`send mail to: ${pendingEntry.submitterEmail}. mail transport id: ${sentMail.messageId}`);
        return sentMail.messageId;
    }
}
