import { Link, useLocation } from 'react-router-dom';
import { LEGAL_NAV } from './LegalPageLayout';

export function InformationPageTabs() {
    const { pathname } = useLocation();
    const currentPath = pathname.replace(/^\/legal\//, '/');

    return (
        <nav aria-label="Información de Finix" className="mb-6 md:mb-8">
            {/* Mobile compact pill bar: keeps title and content immediately reachable without pushing below fold */}
            <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
                {LEGAL_NAV.map(item => {
                    const isActive = currentPath === item.to;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all border ${
                                isActive
                                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                    : 'bg-card/80 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Tablet & Desktop grid of cards */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {LEGAL_NAV.map(item => {
                    const isActive = currentPath === item.to;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            className={`group relative flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                isActive
                                    ? 'bg-primary/10 border-primary/40 shadow-xs shadow-primary/10'
                                    : 'bg-card border-border/50 hover:border-border hover:bg-card/80'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
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
            </div>
        </nav>
    );
}
