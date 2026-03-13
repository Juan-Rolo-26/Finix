export declare class MailService {
    private readonly logger;
    private escapeHtml;
    private getAppUrl;
    private getResendApiKey;
    private getEmailFrom;
    private getContactEmailTo;
    private buildAppLink;
    private renderCodeEmail;
    private sendEmail;
    private sendCodeEmail;
    sendVerificationCode(email: string, code: string): Promise<any>;
    sendLoginCode(email: string, code: string): Promise<any>;
    sendPasswordResetCode(email: string, code: string): Promise<any>;
    sendNotificationEmail(email: string, params: {
        username?: string | null;
        title: string;
        content?: string | null;
        link?: string | null;
    }): Promise<any>;
    sendContactMessage(params: {
        name: string;
        email: string;
        subject: string;
        message: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<any>;
}
