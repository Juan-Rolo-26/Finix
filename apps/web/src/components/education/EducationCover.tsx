export interface EducationCoverImage { src: string; alt: string }

/** Credits and source are displayed in the linked article's image caption. */
export function EducationCover({ image }: { image?: EducationCoverImage | null }) {
    const src = typeof image?.src === "string" ? image.src.trim() : "";
    if (!src) return null;
    const alt = typeof image?.alt === "string" ? image.alt : "";

    return (
        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
            <img src={src} alt={alt} width={960} height={540}
                loading="lazy" decoding="async"
                className={"aspect-video w-full " + (src.includes("/assets/") ? "object-cover" : "object-contain bg-white p-2")} />
        </div>
    );
}
