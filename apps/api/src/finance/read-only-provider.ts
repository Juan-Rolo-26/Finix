/** Contract only: no provider is registered, no tokens or bank credentials stored. */
export interface ReadOnlyFinanceProvider {
    readonly id: string;
    readonly capabilities: { country: 'AR'; accountTransactions: boolean; cardTransactions: boolean; institutions: string[] };
    beginConsent(ownerId: string, returnUrl: string): Promise<{ authorizationUrl: string; expiresAt: Date }>;
    status(ownerId: string, connectionId: string): Promise<{
        state: 'active' | 'expired' | 'revoked' | 'stale' | 'error';
        scopes: string[]; institution: string; lastSyncedAt: Date | null; expiresAt: Date | null;
    }>;
    pull(ownerId: string, connectionId: string, cursor?: string): Promise<{
        // Provider-specific rows must pass the same preview/review pipeline as CSV.
        rows: unknown[]; cursor?: string; syncedAt: Date;
    }>;
    revoke(ownerId: string, connectionId: string, eraseImportedData: boolean): Promise<void>;
}
export const enabledFinanceProviders: readonly ReadOnlyFinanceProvider[] = [];
