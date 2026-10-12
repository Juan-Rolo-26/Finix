import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { educationHrefForTerm } from '@/lib/educationGlossary';
import { isEducationEnabled } from '@/lib/featureFlags';

export function EduInfoBadge({
    term,
    title,
    className = '',
}: {
    term: string;
    title?: string;
    className?: string;
}) {
    if (!isEducationEnabled()) {
        return null;
    }

    const targetUrl = educationHrefForTerm(term);

    return (
        <Link
            to={targetUrl}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors ml-1 align-middle shrink-0 ${className}`}
            title={title || `Aprender más sobre ${term} en Educativa`}
            aria-label={`Aprender más sobre ${term}`}
        >
            <Info className="w-3.5 h-3.5" />
        </Link>
    );
}
