import { NewsCard, type NewsSlotData } from './NewsCard';

interface NewsMosaicProps {
    slots: NewsSlotData[];
    categoryColor?: string;
    categoryName?: string;
    onClickTracking?: (slotId: string) => void;
}

function SlotSkeleton({ variant }: { variant: 'hero' | 'standard' | 'banner' }) {
    const heightClass =
        variant === 'hero' ? 'min-h-[380px] lg:min-h-[480px]' :
        variant === 'banner' ? 'min-h-[130px]' :
        'min-h-[260px]';
    return (
        <div className={`rounded-3xl bg-secondary/30 animate-pulse ${heightClass}`} />
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

    const sharedProps = { categoryColor, categoryName, onClickTracking };

    return (
        <div className="space-y-4">
            {/* Row 1: Slot 1 (hero) + Slot 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <NewsCard slot={s1} variant="hero" {...sharedProps} />
                <NewsCard slot={s2} variant="standard" {...sharedProps} />
            </div>
            {/* Row 2: Slot 3 + Slot 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NewsCard slot={s3} variant="standard" {...sharedProps} />
                <NewsCard slot={s4} variant="standard" {...sharedProps} />
            </div>
            {/* Row 3: Slot 5 (banner) */}
            <NewsCard slot={s5} variant="banner" {...sharedProps} />
        </div>
    );
}

export function NewsMosaicSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <SlotSkeleton variant="hero" />
                <SlotSkeleton variant="standard" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SlotSkeleton variant="standard" />
                <SlotSkeleton variant="standard" />
            </div>
            <SlotSkeleton variant="banner" />
        </div>
    );
}
