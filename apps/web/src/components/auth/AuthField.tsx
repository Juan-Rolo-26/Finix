import { type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

type Props = ComponentProps<typeof Input> & { id: string; label: string; hint?: string; error?: string; formError?: boolean; onToggle?: () => void; revealed?: boolean };
export default function AuthField({ id, label, hint, error, formError, onToggle, revealed, ...props }: Props) {
    const description = [hint && `${id}-hint`, error && `${id}-error`, formError && 'auth-error'].filter(Boolean).join(' ') || undefined;
    return <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
        {hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
        <div className="relative">
            <Input {...props} id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={description} className={`h-11 bg-secondary/50 border-input/50 focus:border-primary/50 ${onToggle ? 'pr-12' : ''}`} />
            {onToggle && <button type="button" onClick={onToggle} aria-label={`${revealed ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={revealed} className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {revealed ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>}
        </div>
        {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>;
}
