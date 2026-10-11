import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface PathItem {
  id: string;
  order: number;
  article: {
    id: string;
    title: string;
    slug: string;
    description: string;
    readTimeMin: number;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    category: {
      id: string;
      title: string;
      slug: string;
      icon: string;
    };
  };
}

interface LearningPathDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  level: string;
  items: PathItem[];
}

export const EducationLearningPathPage: React.FC = () => {
  const { pathSlug } = useParams<{ pathSlug: string }>();
  const user = useAuthStore(state => state.user);
  const [pathData, setPathData] = useState<LearningPathDetail | null>(null);
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPath = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(`/education/learning-paths/${pathSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setPathData(data);

        // Fetch completed progress if logged in
        if (user) {
          try {
            const progRes = await apiFetch('/education/progress');
            if (progRes.ok) {
              const progData = await progRes.json();
              if (Array.isArray(progData)) {
                const set = new Set<string>(
                  progData.filter((p: any) => p.isCompleted).map((p: any) => p.article?.slug || p.articleSlug)
                );
                setCompletedSlugs(set);
              }
            }
          } catch {
            // Ignore progress error if unauthenticated
          }
        }
      } catch (err: any) {
        console.error('Error fetching learning path:', err);
        setError('No se pudo cargar la ruta de aprendizaje solicitada.');
      } finally {
        setLoading(false);
      }
    };

    if (pathSlug) {
      fetchPath();
    }
  }, [pathSlug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Cargando ruta de aprendizaje...</p>
        </div>
      </div>
    );
  }

  if (error || !pathData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Ruta de aprendizaje no encontrada</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'La ruta solicitada no existe o fue retirada.'}</p>
        <Link
          to="/educativa"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Educativa
        </Link>
      </div>
    );
  }

  const totalLessons = pathData.items?.length || 0;
  const completedCount = pathData.items?.filter(item => completedSlugs.has(item.article.slug)).length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalReadMinutes = pathData.items?.reduce((acc, curr) => acc + (curr.article.readTimeMin || 5), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          to="/educativa"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Biblioteca Educativa</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Ruta Guiada</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Banner Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nivel: {pathData.level}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {pathData.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {pathData.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  {totalLessons} lecciones ordenadas
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  ~{totalReadMinutes} min estimados en total
                </span>
              </div>
            </div>

            {/* Progress gauge */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[160px] text-center">
              <span className="text-xs text-slate-400 font-medium mb-1">Tu avance</span>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                {progressPercent}%
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 my-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500">
                {completedCount} de {totalLessons} completadas
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Contenido paso a paso
            </h2>
            <span className="text-xs text-slate-500">
              Seguí el orden sugerido para afianzar cada concepto
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:top-4 before:bottom-4 before:left-3 sm:before:left-4 before:w-0.5 before:bg-slate-800">
            {pathData.items?.map((item, idx) => {
              const isCompleted = completedSlugs.has(item.article.slug);
              return (
                <div key={item.id} className="relative group">
                  {/* Step bullet */}
                  <div className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:border-slate-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <Link
                    to={`/educativa/${item.article.category.slug}/${item.article.slug}`}
                    className={`block p-5 rounded-2xl border transition-all duration-200 ${
                      isCompleted
                        ? 'bg-slate-900/40 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-900/70'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            Paso {idx + 1}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {item.article.category.title}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition">
                          {item.article.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                          {item.article.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.article.readTimeMin} min
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[10px] tracking-wider font-semibold">
                            {item.article.level}
                          </span>
                        </div>
                      </div>

                      <div className="self-center flex items-center gap-2 text-slate-500 group-hover:text-emerald-400 transition pl-2">
                        <span className="text-xs font-semibold hidden sm:inline">
                          {isCompleted ? 'Repasar' : 'Comenzar'}
                        </span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Aviso educativo: Esta ruta formativa tiene fines pedagógicos y no constituye asesoramiento financiero ni recomendación de inversión.
          </p>
        </div>
      </div>
    </div>
  );
};
