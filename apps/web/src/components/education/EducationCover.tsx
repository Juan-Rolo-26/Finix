export interface EducationCoverImage { src: string; alt: string }

/** Credits and source are displayed in the linked article's image caption. */
export function EducationCover({ image }: { image?: EducationCoverImage }) {
    if (!image) return null;
    return (
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
            <img src={image.src} alt={image.alt} width={960} height={540}
                loading="lazy" decoding="async"
                className={`aspect-video w-full ${image.src.includes("/assets/") ? "object-cover" : "object-contain bg-white p-2"}`} />
        </div>
    );
}
