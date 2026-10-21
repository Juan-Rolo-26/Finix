import { useTranslation } from '@/i18n';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BadgeCheck, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface VerificationRequest {
    id: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'expired';
    fullName: string;
    rejectionReason?: string;
}

export default function FinancialVerificationTab() {
    const { ui } = useTranslation();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        documentType: 'DNI',
        documentCountry: 'Argentina',
        documentNumber: '',
        professionalCategory: 'Asesor Financiero',
        registrationNumber: '',
        registrationEntity: 'CNV',
        professionalCountry: 'Argentina',
        experienceYears: '',
        specialization: '',
        company: '',
        professionalPosition: '',
        website: '',
        linkedin: '',
        professionalDescription: '',
    });

    const [files, setFiles] = useState<{
        front: File | null;
        back: File | null;
        professional: File | null;
    }>({
        front: null,
        back: null,
        professional: null,
    });

    const [consent, setConsent] = useState({
        trueDocs: false,
        revoke: false,
    });

    useEffect(() => {
        if (user) {
            fetchRequest();
        }
    }, [user?.id]);

    const fetchRequest = async (background=false) => {
        try {
            if(!background)setLoading(true);
            setLoadError(false);
            const res = await apiFetch('/me/verification');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (res.ok) {
                const body = await res.text();
                const data = body.trim() ? JSON.parse(body) : null;
                if (data && data.id) {
                    setRequest(data as VerificationRequest);
                    if(data.status==='approved' && !useAuthStore.getState().user?.isVerified)useAuthStore.getState().updateUser({isVerified:true});
                } else {
                    setRequest(null);
                }
            }
        } catch (e) {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(()=>{
        if(!request||!['pending','under_review'].includes(request.status))return;
        const refresh=()=>{if(document.visibilityState==='visible')void fetchRequest(true);};
        const interval=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);
        return()=>{window.clearInterval(interval);window.removeEventListener('focus',refresh);};
    },[request?.id,request?.status]);

    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiFetch('/me/verification/documents', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            let msg = ui("Error subiendo archivo");
            try {
                const err = await res.json();
                msg = err.message || msg;
            } catch { }
            throw new Error(msg);
        }
        const data = await res.json();
        if (typeof data.path === 'string' && data.path) {
            return data.path;
        }
        throw new Error(ui("Respuesta inválida del servidor"));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consent.trueDocs || !consent.revoke) {
            alert(ui("Debes aceptar ambos consentimientos para continuar."));
            return;
        }
        if (!files.front || !files.back || !files.professional) {
            alert(ui("Falta adjuntar documentación obligatoria (DNI frente, dorso o acreditación profesional)."));
            return;
        }

        if ([files.front, files.back, files.professional].some(file => file && (file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)))) {
            alert(ui("Solo se permiten documentos PDF, JPG, PNG o WEBP de hasta 5 MB"));
            return;
        }

        setIsSubmitting(true);
        try {
            const frontPath = await uploadFile(files.front);
            const backPath = await uploadFile(files.back);
            const profPath = await uploadFile(files.professional);

            const payload = {
                consent,
                fullName: form.fullName,
                documentType: form.documentType,
                documentCountry: form.documentCountry,
                documentNumber: form.documentNumber,
                professionalCategory: form.professionalCategory,
                registrationNumber: form.registrationNumber,
                registrationEntity: form.registrationEntity,
                professionalCountry: form.professionalCountry,
                identityDocumentFrontPath: frontPath,
                identityDocumentBackPath: backPath,
                professionalDocumentPath: profPath,
                experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
                specialization: form.specialization || null,
                company: form.company || null,
                professionalPosition: form.professionalPosition || null,
                website: form.website || null,
                linkedin: form.linkedin || null,
                professionalDescription: form.professionalDescription || null,
            };

            const res = await apiFetch('/me/verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let msg = ui("Ocurrió un error al enviar la solicitud");
                try {
                    const err = await res.json();
                    msg = err.message || msg;
                } catch { }
                throw new Error(msg);
            }

            alert(ui("Solicitud enviada correctamente. El equipo revisará tu documentación."));
            await fetchRequest();
        } catch (e: any) {
            alert(e.message || ui("Ocurrió un error al enviar la solicitud"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    if (loadError) return <div role="alert" className="p-4 space-y-3"><p>{ui('No se pudo consultar la verificación. Reintentá antes de enviar documentación.')}</p><Button onClick={() => void fetchRequest()}>{ui('Reintentar')}</Button></div>;

    if (request && ['pending', 'under_review'].includes(request.status)) {
        return (
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <Clock className="w-12 h-12 text-amber-500" />
                    <div>
                        <h3 className="text-xl font-bold text-amber-500">{ui("Solicitud en revisión")} </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{ui("Tu solicitud para convertirte en Asesor Financiero Verificado está siendo revisada por nuestro equipo. Te notificaremos cuando tengamos novedades.")} </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (request && request.status === 'approved') {
        return (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <div>
                        <h3 className="text-xl font-bold text-emerald-500">{ui("¡Asesor Financiero Verificado!")} </h3>
                        <p className="text-sm text-emerald-500/80 mt-2 max-w-md mx-auto">{ui("Tu cuenta ha sido aprobada y ahora cuentas con la insignia oficial en tu perfil.")} </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (request && request.status === 'suspended') {
        return (
            <Card className="border-border/30 bg-secondary/10">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-xl font-bold">{ui("Verificación Suspendida")} </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{ui("Tu estado de asesor financiero verificado ha sido suspendido temporalmente por la administración de Finix.")} </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold items-center flex gap-2">{ui("¿Sos asesor financiero?")} </h2>
                <p className="text-muted-foreground">{ui("Verificá tu identidad y acreditación profesional para obtener la insignia de Asesor Financiero Verificado en Finix.")} </p>
            </div>

            {request && request.status === 'rejected' && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="p-4 flex gap-3 text-red-500">
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-bold">{ui("Solicitud rechazada")} </p>
                            <p className="text-sm mt-1 opacity-90">{request.rejectionReason || ui("No cumple con los requisitos")}</p>
                            <p className="text-xs mt-2 opacity-80">{ui("Podés corregir la información y volver a solicitar la verificación abajo.")} </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. IDENTIDAD */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>{ui("Identidad")} </CardTitle>
                        <CardDescription>{ui("Información personal y documentos de identidad. Estrictamente confidencial.")} </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-1-verification">{ui("Nombre completo")} </Label>
                                <Input id="settings-field-1-verification" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder={ui("Tal cual figura en tu DNI")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-2-verification">{ui("País de emisión")} </Label>
                                <Input id="settings-field-2-verification" required value={form.documentCountry} onChange={e => setForm({ ...form, documentCountry: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{ui("Tipo de documento")} </Label>
                                <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="Pasaporte">{ui("Pasaporte")} </SelectItem>
                                        <SelectItem value="CI">{ui("Cédula de Identidad")} </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-3-verification">{ui("Número de documento")} </Label>
                                <Input id="settings-field-3-verification" required value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-4-verification">{ui("Foto del frente (DNI/Doc)")} </Label>
                                <Input id="settings-field-4-verification" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFiles({ ...files, front: e.target.files?.[0] || null })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-5-verification">{ui("Foto del dorso (DNI/Doc)")} </Label>
                                <Input id="settings-field-5-verification" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFiles({ ...files, back: e.target.files?.[0] || null })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. ACREDITACIÓN PROFESIONAL */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>{ui("Acreditación profesional")} </CardTitle>
                        <CardDescription>{ui("Datos indispensables que te habilitan como profesional.")} </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-6-verification">{ui("Categoría / Tipo de profesional")} </Label>
                                <Input id="settings-field-6-verification" required value={form.professionalCategory} onChange={e => setForm({ ...form, professionalCategory: e.target.value })} placeholder={ui("Asesor Financiero, Productor Bursátil, etc")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-7-verification">{ui("País de habilitación")} </Label>
                                <Input id="settings-field-7-verification" required value={form.professionalCountry} onChange={e => setForm({ ...form, professionalCountry: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-8-verification">{ui("Matrícula / N° de Registro")} </Label>
                                <Input id="settings-field-8-verification" required value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} placeholder={ui("Ej: Matrícula CNV N° 1234")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-9-verification">{ui("Organismo Emisor")} </Label>
                                <Input id="settings-field-9-verification" required value={form.registrationEntity} onChange={e => setForm({ ...form, registrationEntity: e.target.value })} placeholder={ui("Ej: CNV (Comisión Nacional de Valores)")} />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="settings-field-10-verification">{ui("Documentación oficial comprobatoria")} </Label>
                            <p className="text-xs text-muted-foreground pb-2">{ui("Subí documentación oficial (constancia de inscripción, certificado o matrícula) que permita comprobar tu condición. PDF, JPG o PNG.")} </p>
                            <Input id="settings-field-10-verification" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFiles({ ...files, professional: e.target.files?.[0] || null })} />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. INFORMACIÓN OPCIONAL */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">3</span>{ui("Información adicional — Opcional")} </CardTitle>
                        <CardDescription>{ui("Estos datos no son requisitos, pero ayudan a enriquecer tu perfil.")} </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-11-verification">{ui("Empresa / Institución donde trabaja")} </Label>
                                <Input id="settings-field-11-verification" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-12-verification">{ui("Cargo")} </Label>
                                <Input id="settings-field-12-verification" value={form.professionalPosition} onChange={e => setForm({ ...form, professionalPosition: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-13-verification">{ui("Años de experiencia")} </Label>
                                <Input id="settings-field-13-verification" type="number" min="0" max="80" step="1" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-14-verification">{ui("Especialidad")} </Label>
                                <Input id="settings-field-14-verification" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder={ui("Ej: Renta Fija, Criptomonedas")} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-15-verification">LinkedIn</Label>
                                <Input id="settings-field-15-verification" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-field-16-verification">{ui("Sitio Web Profesional")} </Label>
                                <Input id="settings-field-16-verification" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-field-17-verification">{ui("Descripción profesional")} </Label>
                            <Textarea id="settings-field-17-verification" value={form.professionalDescription} onChange={e => setForm({ ...form, professionalDescription: e.target.value })} placeholder={ui("Breve resumen de tu perfil profesional")} />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. CONSENTIMIENTO */}
                <Card className="border-border/50 bg-card/30">
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start gap-3">
                            <input type="checkbox" id="consent1" className="mt-1" required checked={consent.trueDocs} onChange={e => setConsent({ ...consent, trueDocs: e.target.checked })} />
                            <Label htmlFor="consent1" className="leading-relaxed cursor-pointer">{ui("Confirmo que la información proporcionada es verdadera y autorizo a Finix a utilizar la documentación enviada exclusivamente para verificar mi identidad y condición profesional.")} </Label>
                        </div>
                        <div className="flex items-start gap-3">
                            <input type="checkbox" id="consent2" className="mt-1" required checked={consent.revoke} onChange={e => setConsent({ ...consent, revoke: e.target.checked })} />
                            <Label htmlFor="consent2" className="leading-relaxed cursor-pointer">{ui("Entiendo que Finix puede rechazar o retirar la verificación si la información proporcionada es falsa, insuficiente o deja de ser válida.")} </Label>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isSubmitting} className="w-full font-bold" size="lg">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <BadgeCheck className="w-5 h-5 mr-2" />}{ui("Solicitar Verificación")} </Button>
            </form>
        </div>
    );
}
