import { NewsCard, type NewsSlotData } from './NewsCard';

interface NewsMosaicProps {
    slots: NewsSlotData[];
    categoryColor?: string;
    categoryName?: string;
    onClickTracking?: (slotId: string) => void;
}

function SlotSkeleton({ variant }: { variant: 'hero' | 'featured' | 'standard' | 'banner' }) {
    const heightClass =
        variant === 'hero' ? 'min-h-[300px] sm:min-h-[420px] lg:min-h-[500px]' :
        variant === 'featured' ? 'min-h-[300px] sm:min-h-[420px] lg:min-h-[500px]' :
        variant === 'banner' ? 'min-h-[140px]' :
            'min-h-[240px] sm:min-h-[300px]';
    return (
        <div className={`rounded-3xl bg-secondary/40 border border-border/30 animate-pulse ${heightClass}`} />
    );
}

export function NewsMosaic({ slots, categoryColor, categoryName, onClickTracking }: NewsMosaicProps) {
    const getSlot = (pos: number): NewsSlotData => {
        return slots.find((s) => s.position === pos) ?? {
            id: `placeholder-${pos}`,
            slotKey: `placeholder_slot_${pos}`,
            position: pos,
            isActive: false,
            article: null,
        };
    };

    const s1 = getSlot(1);
    const s2 = getSlot(2);
    const s3 = getSlot(3);
    const s4 = getSlot(4);
    const s5 = getSlot(5);

    const hasS1 = Boolean(s1.isActive && s1.article);
    const hasS2 = Boolean(s2.isActive && s2.article);
    const hasS3 = Boolean(s3.isActive && s3.article);
    const hasS4 = Boolean(s4.isActive && s4.article);
    const hasS5 = Boolean(s5.isActive && s5.article);

    const sharedProps = { categoryColor, categoryName, onClickTracking };

    const showRow1 = hasS1 || hasS2;
    const showRow2 = hasS3 || hasS4;
    const showRow3 = hasS5;

    return (
        <div className="w-full space-y-6">
            {/* Row 1: Hero & Featured */}
            {showRow1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {hasS1 && hasS2 ? (
                        <>
                            <div className="lg:col-span-7 xl:col-span-8 flex">
                                <NewsCard slot={s1} variant="hero" {...sharedProps} />
                            </div>
                            <div className="lg:col-span-5 xl:col-span-4 flex">
                                <NewsCard slot={s2} variant="featured" {...sharedProps} />
                            </div>
                        </>
                    ) : hasS1 ? (
                        <div className="col-span-12 flex">
                            <NewsCard slot={s1} variant="hero" {...sharedProps} />
                        </div>
                    ) : (
                        <div className="col-span-12 flex">
                            <NewsCard slot={s2} variant="hero" {...sharedProps} />
                        </div>
                    )}
                </div>
            )}

            {/* Row 2: Standard cards */}
            {showRow2 && (
                <div className={`grid gap-6 ${hasS3 && hasS4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {hasS3 && <NewsCard slot={s3} variant="standard" {...sharedProps} />}
                    {hasS4 && <NewsCard slot={s4} variant="standard" {...sharedProps} />}
                </div>
            )}

            {/* Row 3: Banner */}
            {showRow3 && (
                <NewsCard slot={s5} variant="banner" {...sharedProps} />
            )}
        </div>
    );
}

export function NewsMosaicSkeleton() {
    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 xl:col-span-8">
                    <SlotSkeleton variant="hero" />
                </div>
                <div className="lg:col-span-5 xl:col-span-4">
                    <SlotSkeleton variant="featured" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SlotSkeleton variant="standard" />
                <SlotSkeleton variant="standard" />
            </div>
            <SlotSkeleton variant="banner" />
        </div>
    );
}
