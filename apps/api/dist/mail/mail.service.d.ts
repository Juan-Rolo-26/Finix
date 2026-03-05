export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendVerificationCode(email: string, code: string): Promise<void>;
    sendPasswordResetLink(email: string, token: string): Promise<void>;
}
