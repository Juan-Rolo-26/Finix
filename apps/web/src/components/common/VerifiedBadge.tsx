export type VerifiedVariant = 'official' | 'verified' | 'influencer' | 'staff';

interface VerifiedBadgeProps {
    variant?: VerifiedVariant;
    isVerified?: boolean;
    isInfluencer?: boolean;
    role?: string;
    username?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
    title?: string;
}

const BADGE_CONFIGS: Record<
    VerifiedVariant,
    { gradientStart: string; gradientEnd: string; shadow: string; label: string }
> = {
    official: {
        gradientStart: '#10B981',
        gradientEnd: '#059669',
        shadow: 'rgba(16, 185, 129, 0.45)',
        label: 'Cuenta oficial de Finix',
    },
    verified: {
        gradientStart: '#10B981',
        gradientEnd: '#059669',
        shadow: 'rgba(16, 185, 129, 0.45)',
        label: 'Cuenta verificada',
    },
    influencer: {
        gradientStart: '#F59E0B',
        gradientEnd: '#D97706',
        shadow: 'rgba(245, 158, 11, 0.45)',
        label: 'Inversor destacado / Creador',
    },
    staff: {
        gradientStart: '#8B5CF6',
        gradientEnd: '#6366F1',
        shadow: 'rgba(139, 92, 246, 0.45)',
        label: 'Equipo de Finix',
    },
};

const SIZES: Record<NonNullable<VerifiedBadgeProps['size']>, { px: number; stroke: number }> = {
    xs: { px: 13, stroke: 1.7 },
    sm: { px: 15, stroke: 1.9 },
    md: { px: 18, stroke: 2.1 },
    lg: { px: 22, stroke: 2.4 },
};

export function resolveVerifiedVariant({
    variant,
    isVerified,
    isInfluencer,
    role,
    username,
}: Pick<VerifiedBadgeProps, 'variant' | 'isVerified' | 'isInfluencer' | 'role' | 'username'>): VerifiedVariant | null {
    if (variant) return variant;

    const lowerUser = (username || '').toLowerCase();
    const isOfficialFinix = lowerUser === 'finix' || lowerUser === 'finixarg' || lowerUser === 'finix_oficial';
    if (isOfficialFinix) return 'official';

    if (isVerified) return 'verified';
    if (isInfluencer) return 'influencer';
    if (role && ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) return 'staff';

    return null;
}

export default function VerifiedBadge({
    variant,
    isVerified,
    isInfluencer,
    role,
    username,
    size = 'sm',
    className = '',
    title,
}: VerifiedBadgeProps) {
    const activeVariant = resolveVerifiedVariant({ variant, isVerified, isInfluencer, role, username });
    if (!activeVariant) return null;

    const config = BADGE_CONFIGS[activeVariant];
    const tooltip = title || config.label;
    const sizeConfig = SIZES[size] || SIZES.sm;
    const gradId = `finix-badge-grad-${activeVariant}-${size}`;

    return (
        <span
            className={`inline-flex items-center shrink-0 align-middle select-none ${className}`}
            title={tooltip}
            aria-label={tooltip}
        >
            <svg
                width={sizeConfig.px}
                height={sizeConfig.px}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 transition-transform duration-150 hover:scale-110"
                style={{ filter: `drop-shadow(0 1px 2.5px ${config.shadow})` }}
            >
                {/* Perfectly round circular badge */}
                <circle cx="8" cy="8" r="7.5" fill={`url(#${gradId})`} />

                {/* Subtle glassmorphic inner rim for premium depth */}
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.28)" strokeWidth="0.75" fill="none" />

                {/* Crisp centered white checkmark */}
                <path
                    d="M4.9 8.2L7.05 10.35L11.35 6"
                    stroke="#FFFFFF"
                    strokeWidth={sizeConfig.stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <defs>
                    <linearGradient id={gradId} x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
                        <stop stopColor={config.gradientStart} />
                        <stop offset="100%" stopColor={config.gradientEnd} />
                    </linearGradient>
                </defs>
            </svg>
        </span>
    );
}
