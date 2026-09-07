import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BadgeCheck, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface VerificationRequest {
    id: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'expired';
    fullName: string;
    rejectionReason?: string;
}

export default function FinancialVerificationTab() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        documentType: 'DNI',
        documentCountry: 'Argentina',
        documentNumber: '',
        professionalCategory: 'Asesor Financiero',
        registrationNumber: '',
        registrationEntity: '',
        professionalCountry: 'Argentina',
        experienceYears: '',
        specialization: '',
        company: '',
        professionalPosition: '',
        website: '',
        linkedin: '',
        professionalDescription: '',
    });

    const [files, setFiles] = useState({
        front: null as File | null,
        back: null as File | null,
        professional: null as File | null,
    });

    const [consent, setConsent] = useState({ trueDocs: false, revoke: false });

    useEffect(() => {
        if (user) {
            fetchRequest();
        }
    }, [user]);

    const fetchRequest = async () => {
        try {
            const { data, error } = await supabase
                .from('FinancialAdvisorVerification')
                .select('id, status, fullName, rejectionReason')
                .eq('userId', user!.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching verification:', error);
            }
            if (data) {
                setRequest(data as VerificationRequest);
            }
        } catch (e) {
            console.error('Failed to fetch verification status', e);
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file: File, folder: string): Promise<string> => {
        const fileName = `${crypto.randomUUID()}-${file.name}`;
        const path = `${user!.id}/${folder}/${fileName}`;
        const { data, error } = await supabase.storage.from('financial-verifications').upload(path, file);
        if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
        return data.path;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consent.trueDocs || !consent.revoke) {
            alert('Debes aceptar ambos consentimientos para continuar.');
            return;
        }
        if (!files.front || !files.back || !files.professional) {
            alert('Falta adjuntar documentación obligatoria (DNI frente, dorso o acreditación profesional).');
            return;
        }

        setIsSubmitting(true);
        try {
            const frontPath = await uploadFile(files.front, 'identity');
            const backPath = await uploadFile(files.back, 'identity');
            const profPath = await uploadFile(files.professional, 'professional');

            const payload = {
                userId: user!.id,
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
                status: 'pending'
            };

            if (request) {
                const { error } = await supabase.from('FinancialAdvisorVerification').update(payload).eq('id', request.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('FinancialAdvisorVerification').insert(payload);
                if (error) throw error;
            }

            alert('Solicitud enviada correctamente. El equipo revisará tu documentación.');
            await fetchRequest();
        } catch (e: any) {
            alert(e.message || 'Ocurrió un error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    if (request && ['pending', 'under_review'].includes(request.status)) {
        return (
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <Clock className="w-12 h-12 text-amber-500" />
                    <div>
                        <h3 className="text-xl font-bold text-amber-500">Solicitud en revisión</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                            Tu solicitud para convertirte en Asesor Financiero Verificado está siendo revisada por nuestro equipo. Te notificaremos cuando tengamos novedades.
                        </p>
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
                        <h3 className="text-xl font-bold text-emerald-500">¡Asesor Financiero Verificado!</h3>
                        <p className="text-sm text-emerald-500/80 mt-2 max-w-md mx-auto">
                            Tu cuenta ha sido aprobada y ahora cuentas con la insignia oficial en tu perfil.
                        </p>
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
                        <h3 className="text-xl font-bold">Verificación Suspendida</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                            Tu estado de asesor financiero verificado ha sido suspendido temporalmente por la administración de Finix.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold items-center flex gap-2">
                    ¿Sos asesor financiero?
                </h2>
                <p className="text-muted-foreground">
                    Verificá tu identidad y acreditación profesional para obtener la insignia de Asesor Financiero Verificado en Finix.
                </p>
            </div>

            {request && request.status === 'rejected' && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="p-4 flex gap-3 text-red-500">
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-bold">Solicitud rechazada</p>
                            <p className="text-sm mt-1 opacity-90">{request.rejectionReason || 'No cumple con los requisitos'}</p>
                            <p className="text-xs mt-2 opacity-80">Podés corregir la información y volver a solicitar la verificación abajo.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. IDENTIDAD */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                            Identidad
                        </CardTitle>
                        <CardDescription>Información personal y documentos de identidad. Estrictamente confidencial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre completo</Label>
                                <Input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Tal cual figura en tu DNI" />
                            </div>
                            <div className="space-y-2">
                                <Label>País de emisión</Label>
                                <Input required value={form.documentCountry} onChange={e => setForm({ ...form, documentCountry: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de documento</Label>
                                <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                        <SelectItem value="CI">Cédula de Identidad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Número de documento</Label>
                                <Input required value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Foto del frente (DNI/Doc)</Label>
                                <Input required type="file" accept="image/*,application/pdf" onChange={e => setFiles({ ...files, front: e.target.files?.[0] || null })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Foto del dorso (DNI/Doc)</Label>
                                <Input required type="file" accept="image/*,application/pdf" onChange={e => setFiles({ ...files, back: e.target.files?.[0] || null })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. ACREDITACIÓN PROFESIONAL */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                            Acreditación profesional
                        </CardTitle>
                        <CardDescription>Datos indispensables que te habilitan como profesional.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Categoría / Tipo de profesional</Label>
                                <Input required value={form.professionalCategory} onChange={e => setForm({ ...form, professionalCategory: e.target.value })} placeholder="Asesor Financiero, Productor Bursátil, etc" />
                            </div>
                            <div className="space-y-2">
                                <Label>País de habilitación</Label>
                                <Input required value={form.professionalCountry} onChange={e => setForm({ ...form, professionalCountry: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Matrícula / N° de Registro</Label>
                                <Input required value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Ej: Matrícula CNV N° 1234" />
                            </div>
                            <div className="space-y-2">
                                <Label>Organismo Emisor</Label>
                                <Input required value={form.registrationEntity} onChange={e => setForm({ ...form, registrationEntity: e.target.value })} placeholder="Ej: CNV (Comisión Nacional de Valores)" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label>Documentación oficial comprobatoria</Label>
                            <p className="text-xs text-muted-foreground pb-2">Subí documentación oficial (constancia de inscripción, certificado o matrícula) que permita comprobar tu condición. PDF, JPG o PNG.</p>
                            <Input required type="file" accept="image/*,application/pdf" onChange={e => setFiles({ ...files, professional: e.target.files?.[0] || null })} />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. INFORMACIÓN OPCIONAL */}
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">3</span>
                            Información adicional — Opcional
                        </CardTitle>
                        <CardDescription>Estos datos no son requisitos, pero ayudan a enriquecer tu perfil.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Empresa / Institución donde trabaja</Label>
                                <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo</Label>
                                <Input value={form.professionalPosition} onChange={e => setForm({ ...form, professionalPosition: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Años de experiencia</Label>
                                <Input type="number" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Especialidad</Label>
                                <Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Ej: Renta Fija, Criptomonedas" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>LinkedIn</Label>
                                <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Sitio Web Profesional</Label>
                                <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción profesional</Label>
                            <Textarea value={form.professionalDescription} onChange={e => setForm({ ...form, professionalDescription: e.target.value })} placeholder="Breve resumen de tu perfil profesional" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. CONSENTIMIENTO */}
                <Card className="border-border/50 bg-card/30">
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start gap-3">
                            <input type="checkbox" id="consent1" className="mt-1" required checked={consent.trueDocs} onChange={e => setConsent({ ...consent, trueDocs: e.target.checked })} />
                            <Label htmlFor="consent1" className="leading-relaxed cursor-pointer">
                                Confirmo que la información proporcionada es verdadera y autorizo a Finix a utilizar la documentación enviada exclusivamente para verificar mi identidad y condición profesional.
                            </Label>
                        </div>
                        <div className="flex items-start gap-3">
                            <input type="checkbox" id="consent2" className="mt-1" required checked={consent.revoke} onChange={e => setConsent({ ...consent, revoke: e.target.checked })} />
                            <Label htmlFor="consent2" className="leading-relaxed cursor-pointer">
                                Entiendo que Finix puede rechazar o retirar la verificación si la información proporcionada es falsa, insuficiente o deja de ser válida.
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isSubmitting} className="w-full font-bold" size="lg">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <BadgeCheck className="w-5 h-5 mr-2" />}
                    Solicitar Verificación
                </Button>
            </form>
        </div>
    );
}
