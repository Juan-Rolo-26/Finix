import { UiText as FinixUiText } from '@/i18n/UiText';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
    fallbackMessage?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary caught error]:', error, errorInfo);

        // Tabs kept open across a deployment can request hashed JS chunks that
        // no longer exist. Refresh once to fetch the current HTML and assets.
        const message = `${error.name} ${error.message}`;
        const isStaleChunk = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk [\w-]+ failed|chunkloaderror/i.test(message);
        if (isStaleChunk && typeof window !== 'undefined') {
            const key = `finix:stale-chunk-reload:${window.location.pathname}`;
            try {
                const previousReload = Number(window.sessionStorage.getItem(key) || 0);
                if (!previousReload || Date.now() - previousReload > 30_000) {
                    window.sessionStorage.setItem(key, String(Date.now()));
                    window.location.reload();
                }
            } catch {
                // Storage can be disabled; leave the retry button available.
            }
        }
    }

    private handleReset = () => {
        if (this.props.onReset) {
            this.props.onReset();
            this.setState({ hasError: false, error: null });
            return;
        }

        // Remounting a rejected lazy module does not fetch its new URL.
        if (typeof window !== 'undefined') {
            window.location.reload();
        } else {
            this.setState({ hasError: false, error: null });
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 my-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                        {this.props.fallbackTitle || 'Hubo un problema al cargar esta sección'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        {this.props.fallbackMessage || 'Ocurrió un error inesperado al procesar los datos. El resto del portafolio sigue funcionando.'}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleReset}
                        className="mt-4 gap-2 text-xs font-bold"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {" "}<FinixUiText text={"Reintentar"} />{" "}</Button>
                </div>
            );
        }

        return this.props.children;
    }
}
