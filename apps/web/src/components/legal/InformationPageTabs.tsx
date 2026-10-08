import { Link, useLocation } from 'react-router-dom';
import { LEGAL_NAV } from './LegalPageLayout';

export function InformationPageTabs() {
    const { pathname } = useLocation();
    const currentPath = pathname.replace(/^\/legal\//, '/');
    return (
        <nav aria-label="Información de Finix" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {LEGAL_NAV.map(item => {
                const isActive = currentPath === item.to;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group relative flex flex-col gap-2.5 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            isActive
                                ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10'
                                : 'bg-card border-border/50 hover:border-border hover:bg-card/80'
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <p className={`text-sm font-semibold leading-snug ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                {item.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{item.desc}</p>
                        </div>
                        {isActive && (
                            <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary/60" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
