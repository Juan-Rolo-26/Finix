import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackButtonProps {
    to?: string;
    onClick?: () => void;
    label?: string;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

const baseClass =
    'inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-secondary/70 hover:text-foreground hover:shadow-sm active:scale-95';

export default function BackButton({
    to,
    onClick,
    label = 'Volver al inicio',
    className,
    iconClassName,
    disabled = false,
    type = 'button',
}: BackButtonProps) {
    const content = (
        <>
            <ArrowLeft className={cn('h-4 w-4 shrink-0', iconClassName)} />
            <span>{label}</span>
        </>
    );

    if (to && !disabled) {
        return (
            <Link to={to} className={cn(baseClass, className)}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClass, 'disabled:pointer-events-none disabled:opacity-40', className)}
        >
            {content}
        </button>
    );
}
