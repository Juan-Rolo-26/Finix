/** Block index keeps repeated headings addressable, including accented Spanish titles. */
export function educationHeadingId(title: string, blockIndex: number) {
    const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'sec-' + blockIndex + '-' + (slug || 'lectura');
}
