import { FormEvent, useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { readApiError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CONTACT_EMAIL = 'finiixarg@gmail.com';

type ContactFormSectionProps = {
    id?: string;
    className?: string;
    eyebrow?: string;
    title?: string;
    description?: string;
};

export default function ContactFormSection({
    id = 'contacto',
    className,
    eyebrow = 'Contacto',
    title = 'Mandanos un mensaje',
    description = 'Completá el formulario y el equipo de Finix lo recibe por mail en finiixarg@gmail.com.',
}: ContactFormSectionProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await apiFetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    subject: subject.trim(),
                    message: message.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(await readApiError(response) || 'No pudimos enviar tu mensaje. Intentá de nuevo.');
            }

            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
            setFeedback({
                type: 'success',
                message: 'Mensaje enviado. Te responderemos pronto en el correo que nos dejaste.',
            });
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'No pudimos enviar tu mensaje.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section
            id={id}
            className={cn(
                'rounded-[32px] border border-primary/15 bg-card/75 p-6 shadow-[0_20px_60px_hsl(var(--background)/0.32)] backdrop-blur-xl md:p-8',
                className,
            )}
        >
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div className="space-y-5">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                    </div>

                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                            {eyebrow}
                        </p>
                        <h3 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h3>
                        <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                            {description}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Destino</p>
                        <p className="mt-2 text-base font-semibold text-foreground">{CONTACT_EMAIL}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Usá este formulario para consultas, soporte, alianzas o feedback de producto.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor={`${id}-name`} className="text-sm font-medium text-foreground">
                                Nombre
                            </label>
                            <Input
                                id={`${id}-name`}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Tu nombre"
                                autoComplete="name"
                                maxLength={80}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor={`${id}-email`} className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <Input
                                id={`${id}-email`}
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="tu@email.com"
                                autoComplete="email"
                                maxLength={120}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor={`${id}-subject`} className="text-sm font-medium text-foreground">
                            Asunto
                        </label>
                        <Input
                            id={`${id}-subject`}
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="¿En qué te podemos ayudar?"
                            maxLength={140}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor={`${id}-message`} className="text-sm font-medium text-foreground">
                            Mensaje
                        </label>
                        <Textarea
                            id={`${id}-message`}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Contanos tu consulta, idea o problema."
                            className="min-h-[160px] resize-y"
                            maxLength={2000}
                            required
                        />
                    </div>

                    {feedback && (
                        <div
                            className={cn(
                                'rounded-2xl border px-4 py-3 text-sm',
                                feedback.type === 'success'
                                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                    : 'border-red-500/25 bg-red-500/10 text-red-300',
                            )}
                            aria-live="polite"
                        >
                            {feedback.message}
                        </div>
                    )}

                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar mensaje
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </section>
    );
}
