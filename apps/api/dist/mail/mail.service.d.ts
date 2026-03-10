export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    private escapeHtml;
    private getAppUrl;
    private sendCodeEmail;
    sendVerificationCode(email: string, code: string): Promise<void>;
    sendLoginCode(email: string, code: string): Promise<void>;
    sendPasswordResetCode(email: string, code: string): Promise<void>;
    sendNotificationEmail(email: string, params: {
        username?: string | null;
        title: string;
        content?: string | null;
        link?: string | null;
    }): Promise<void>;
}
