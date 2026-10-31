import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LEADER_QUOTES, type LeaderQuote } from './quotes-data';

// Reliable high-resolution online fallbacks if a local asset fails to load
const ONLINE_PORTRAIT_FALLBACKS: Record<string, string> = {
    'Warren Buffett': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit.jpg/440px-Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit.jpg',
    'Charlie Munger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Charlie_Munger_%28cropped%29.jpg/440px-Charlie_Munger_%28cropped%29.jpg',
    'Steve Jobs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/440px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    'Marcos Galperin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Marcos_Galperin_in_2019.jpg/440px-Marcos_Galperin_in_2019.jpg',
    'Peter Lynch': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Peter_Lynch_2014.jpg/440px-Peter_Lynch_2014.jpg',
    'Jeff Bezos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Jeff_Bezos_visiting_LAAFB_SMC_%2839361618360%29_%28cropped%29.jpg/440px-Jeff_Bezos_visiting_LAAFB_SMC_%2839361618360%29_%28cropped%29.jpg',
    'Elon Musk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/440px-Elon_Musk_Royal_Society_%28crop2%29.jpg',
    'Benjamin Graham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Benjamin_Graham_%281894-1976%29_portrait_circa_1950.jpg/440px-Benjamin_Graham_%281894-1976%29_portrait_circa_1950.jpg',
    'Howard Marks': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Howard_Marks_2018.jpg/440px-Howard_Marks_2018.jpg',
    'Ray Dalio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ray_Dalio_2017.jpg/440px-Ray_Dalio_2017.jpg',
    'Jensen Huang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Jensen_Huang_at_Computex_2023.jpg/440px-Jensen_Huang_at_Computex_2023.jpg',
    'Bill Gates': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/440px-Bill_Gates_2017_%28cropped%29.jpg',
    'Pierpaolo Barbieri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pierpaolo_Barbieri_%28cropped%29.jpg/440px-Pierpaolo_Barbieri_%28cropped%29.jpg',
    'Satya Nadella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/440px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg',
    'Sam Altman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Sam_Altman_TechCrunch_Disrupt_2019_%28cropped%29.jpg/440px-Sam_Altman_TechCrunch_Disrupt_2019_%28cropped%29.jpg',
    'Mark Zuckerberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/440px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',
    'Jack Bogle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/John_Bogle_2012.jpg/440px-John_Bogle_2012.jpg',
    'George Soros': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/George_Soros_-_Festival_del_Sole_2012.jpg/440px-George_Soros_-_Festival_del_Sole_2012.jpg',
    'Sir John Templeton': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sir_John_Templeton.jpg/440px-Sir_John_Templeton.jpg',
    'Stanley Druckenmiller': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Stanley_Druckenmiller_%28cropped%29.jpg/440px-Stanley_Druckenmiller_%28cropped%29.jpg',
    'Tim Cook': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tim_Cook_2017_%28cropped%29.jpg/440px-Tim_Cook_2017_%28cropped%29.jpg',
    'Sundar Pichai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Sundar_pichai.png/440px-Sundar_pichai.png',
    'Larry Ellison': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Larry_Ellison_portrait_cropped.jpg/440px-Larry_Ellison_portrait_cropped.jpg',
    'Bernard Arnault': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Bernard_Arnault_%282017%29.jpg/440px-Bernard_Arnault_%282017%29.jpg',
};

export function HomeAnnouncementBanner() {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [failedMap, setFailedMap] = useState<Record<number, boolean>>({});
    const [useFallbackMap, setUseFallbackMap] = useState<Record<number, boolean>>({});

    const totalQuotes = LEADER_QUOTES.length;

    // Auto-advance banner every 8 seconds when not hovering
    useEffect(() => {
        if (isPaused || totalQuotes <= 1) return;

        const timer = setInterval(() => {
            setCurrentIdx((prev) => (prev + 1) % totalQuotes);
        }, 8000);

        return () => clearInterval(timer);
    }, [isPaused, totalQuotes]);

    const quote: LeaderQuote = LEADER_QUOTES[currentIdx] || LEADER_QUOTES[0];

    const handleNext = useCallback(() => {
        setCurrentIdx((prev) => (prev + 1) % totalQuotes);
    }, [totalQuotes]);

    const handlePrev = useCallback(() => {
        setCurrentIdx((prev) => (prev - 1 + totalQuotes) % totalQuotes);
    }, [totalQuotes]);

    const initials = useMemo(() => {
        return quote.author
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('');
    }, [quote.author]);

    // Determine current image source (primary local or fallback online)
    const activeImageSrc = useMemo(() => {
        if (useFallbackMap[quote.id] && ONLINE_PORTRAIT_FALLBACKS[quote.author]) {
            return ONLINE_PORTRAIT_FALLBACKS[quote.author];
        }
        return quote.imageUrl;
    }, [quote.id, quote.imageUrl, quote.author, useFallbackMap]);

    return (
        <section
            className="w-full mb-4 select-none group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Cita destacada de líderes del mercado e inversión"
        >
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 sm:p-5 transition-all dark:bg-[#07191d]/75 dark:border-emerald-500/20 shadow-xs">
                {/* Main Content: Large Portrait + Quote + Footer Attribution */}
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                    {/* Large Author Portrait */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-muted/60 flex items-center justify-center border border-border/80 shadow-md overflow-hidden relative ring-2 ring-emerald-500/20">
                            {/* Initials Fallback */}
                            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 select-none">
                                {initials}
                            </span>
                            {/* Verified Photo with eager loading and fallback recovery */}
                            {!failedMap[quote.id] && (
                                <img
                                    key={`${quote.id}-${activeImageSrc}`}
                                    src={activeImageSrc}
                                    alt={quote.author}
                                    className="absolute inset-0 w-full h-full object-cover object-top rounded-2xl transition-transform duration-300 group-hover:scale-105 z-10"
                                    onError={() => {
                                        // Try online fallback first if not tried yet
                                        if (!useFallbackMap[quote.id] && ONLINE_PORTRAIT_FALLBACKS[quote.author]) {
                                            setUseFallbackMap((prev) => ({ ...prev, [quote.id]: true }));
                                        } else {
                                            setFailedMap((prev) => ({ ...prev, [quote.id]: true }));
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Text block: Quote & attribution + Navigation controls */}
                    <div className="min-w-0 flex-1 w-full space-y-2.5">
                        <blockquote className="text-base sm:text-lg md:text-[19px] font-medium text-foreground leading-snug sm:leading-relaxed tracking-tight text-center sm:text-left">
                            “{quote.quote}”
                        </blockquote>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/30">
                            {/* Author info */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                                <span className="font-bold text-foreground">{quote.author}</span>
                                <span className="opacity-40">·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{quote.role}</span>
                                <span className="opacity-40">·</span>
                                <span>{quote.company}</span>
                            </div>

                            {/* Minimal Navigation */}
                            <div className="flex items-center gap-1 ml-auto shrink-0">
                                <span className="text-[11px] font-mono text-muted-foreground mr-1.5 select-none">
                                    {currentIdx + 1} / {totalQuotes}
                                </span>
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                                    aria-label="Frase anterior"
                                    title="Anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                                    aria-label="Frase siguiente"
                                    title="Siguiente"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
