import { Link } from 'react-router-dom';
import { Shield, Crown } from 'lucide-react';

export function FinixHomeFooter() {
    return (
        <footer className="w-full bg-card text-card-foreground border-t border-border/80 mt-12 py-10 transition-colors">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-10 border-b border-border/60">
                    {/* Brand column */}
                    <div className="col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                            <img
                                src="/finix-brand-logo.png"
                                alt="Finix"
                                className="h-8 sm:h-9 w-auto object-contain dark:hidden"
                            />
                            <img
                                src="/finix-brand-logo-white.png"
                                alt="Finix"
                                className="h-8 sm:h-9 w-auto object-contain hidden dark:block"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                            La plataforma de información financiera, análisis fundamental y comunidad para inversores de Argentina y el mundo.
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Datos de mercado e información en tiempo real</span>
                        </div>
                    </div>

                    {/* Mercados */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Mercados
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li><Link to="/market" className="hover:text-primary transition-colors">Dólares y Cotizaciones</Link></li>
                            <li><Link to="/market" className="hover:text-primary transition-colors">Acciones Líderes (Merval)</Link></li>
                            <li><Link to="/market" className="hover:text-primary transition-colors">CEDEARs de Wall Street</Link></li>
                            <li><Link to="/market" className="hover:text-primary transition-colors">Bonos Soberanos (AL30, GD30)</Link></li>
                            <li><Link to="/market" className="hover:text-primary transition-colors">Obligaciones Negociables</Link></li>
                            <li><Link to="/market" className="hover:text-primary transition-colors">Criptomonedas</Link></li>
                        </ul>
                    </div>

                    {/* Herramientas */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Herramientas
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link to="/laboratorio" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    <span>Laboratorio Financiero</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.5625rem] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Crown className="w-2 h-2 fill-amber-400 text-amber-500 shrink-0" />
                                        PRO
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/analysis" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    <span>Modelos DCF y Valuación</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.5625rem] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Crown className="w-2 h-2 fill-amber-400 text-amber-500 shrink-0" />
                                        PRO
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/market/seguimiento" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    <span>Seguimiento / Watchlists</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.5625rem] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Crown className="w-2 h-2 fill-amber-400 text-amber-500 shrink-0" />
                                        PRO
                                    </span>
                                </Link>
                            </li>
                            <li><Link to="/calendario" className="hover:text-primary transition-colors">Calendario Económico</Link></li>
                            <li>
                                <Link to="/portfolio" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    <span>Mi Portafolio</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.5625rem] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Crown className="w-2 h-2 fill-amber-400 text-amber-500 shrink-0" />
                                        PRO
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/mercado/mejores-rendimientos" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    <span>Mejores Rendimientos</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[0.5625rem] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Crown className="w-2 h-2 fill-amber-400 text-amber-500 shrink-0" />
                                        PRO
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Comunidad & Legal */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Plataforma
                        </h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li><Link to="/analysis" className="hover:text-primary transition-colors">Análisis Fundamental (DCF)</Link></li>
                            <li><Link to="/news" className="hover:text-primary transition-colors">Noticias Finix</Link></li>
                            <li><Link to="/info/about" className="hover:text-primary transition-colors">Quiénes Somos</Link></li>
                            <li><Link to="/info/contact" className="hover:text-primary transition-colors">Contacto y Soporte</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">Términos del Servicio</Link></li>
                            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-6 space-y-3">
                    <p className="text-[0.6875rem] text-muted-foreground/80 leading-relaxed text-justify">
                        <strong>Aviso Legal y Disclaimer Financiero:</strong> La información provista por Finix (finixarg.com) tiene fines exclusivamente informativos y educativos. Finix no brinda asesoramiento financiero ni sugerencias personalizadas de inversión. Los precios y cotizaciones pueden contar con demoras reglamentarias según el proveedor del mercado. El rendimiento pasado no garantiza resultados futuros.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-between text-[0.6875rem] text-muted-foreground pt-2">
                        <span>© {new Date().getFullYear()} Finix. Todos los derechos reservados.</span>
                        <span className="flex items-center gap-1 mt-1 sm:mt-0">
                            Hecho para inversores por inversores
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
