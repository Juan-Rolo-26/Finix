const fs = require('fs');
const { Client } = require('/home/juampi26/Finix/node_modules/pg');
const env = require('/home/juampi26/Finix/node_modules/dotenv').parse(fs.readFileSync('/home/juampi26/Finix/apps/api/.env'));
const { SEED_CATEGORIES, SEED_ARTICLES, SEED_LEARNING_PATHS } = require('/home/juampi26/Finix/apps/api/src/education/education-seed.data.ts');
const { EDUCATION_BASELINE_ARTICLES } = require('/home/juampi26/Finix/apps/api/src/education/education-baseline.data.ts');

const canonical = (v) =>
    Array.isArray(v)
        ? v.map(canonical)
        : v && typeof v === 'object' && !(v instanceof Date)
        ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]))
        : v;

const COMPARE_FIELDS = [
    'title', 'summary', 'content', 'level', 'isFeatured', 'readTimeMinutes',
    'order', 'formula', 'interactiveWidget', 'keyTakeaways', 'commonMistakes',
    'prosCons', 'practicalExample', 'sources'
];

(async () => {
    const url = new URL(env.DIRECT_URL || env.DATABASE_URL);
    url.search = '';
    const db = new Client({ connectionString: url.toString() });
    try {
        await db.connect();
        console.log('Connected to PostgreSQL database for safe field-by-field sync...');

        // 1. Fetch categories & subcategories maps
        const catRes = await db.query('SELECT id, slug FROM "EducationCategory"');
        const catMap = new Map(catRes.rows.map(r => [r.slug, r.id]));

        const subRes = await db.query('SELECT id, slug FROM "EducationSubcategory"');
        const subMap = new Map(subRes.rows.map(r => [r.slug, r.id]));

        // 2. Fetch existing articles
        const artRes = await db.query('SELECT * FROM "EducationArticle"');
        const existingMap = new Map(artRes.rows.map(r => [r.slug, r]));

        let createdCount = 0;
        let updatedCount = 0;
        let preservedCount = 0;

        for (const art of SEED_ARTICLES) {
            const catId = catMap.get(art.categorySlug);
            const subId = art.subcategorySlug ? subMap.get(art.subcategorySlug) : null;
            const existing = existingMap.get(art.slug);

            if (!existing) {
                // Insert new article
                await db.query(`
                    INSERT INTO "EducationArticle" (
                        id, title, slug, summary, content, "categoryId", "subcategoryId",
                        level, status, "isFeatured", "readTimeMinutes", "order",
                        formula, "interactiveWidget", "keyTakeaways", "commonMistakes",
                        "prosCons", "practicalExample", sources, "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
                        $7, 'PUBLISHED', $8, $9, $10,
                        $11, $12, $13, $14,
                        $15, $16, $17, NOW(), NOW()
                    )
                `, [
                    art.title, art.slug, art.summary, art.content, catId, subId,
                    art.level, art.isFeatured, art.readTimeMinutes, art.order,
                    art.formula || null, art.interactiveWidget || null,
                    JSON.stringify(art.keyTakeaways || []),
                    JSON.stringify(art.commonMistakes || []),
                    art.prosCons ? JSON.stringify(art.prosCons) : null,
                    art.practicalExample || null,
                    JSON.stringify(art.sources || [])
                ]);
                createdCount++;
            } else {
                // Existing article: strict safety check
                if (existing.status !== 'PUBLISHED') {
                    console.log(`Skipping article ${art.slug} (status=${existing.status} preserved)`);
                    preservedCount++;
                    continue;
                }

                const baselineArt = EDUCATION_BASELINE_ARTICLES.find(b => b.slug === art.slug);
                if (baselineArt) {
                    const fieldsToUpdate = [];
                    const values = [];

                    for (const field of COMPARE_FIELDS) {
                        const dbVal = canonical(existing[field] ?? null);
                        const baseVal = canonical(baselineArt[field] ?? null);
                        const newVal = canonical(art[field] ?? null);

                        const dbStr = JSON.stringify(dbVal);
                        const baseStr = JSON.stringify(baseVal);
                        const newStr = JSON.stringify(newVal);

                        // If DB value matches baseline (titular did not edit this field)
                        // and new seed value is different, update this field!
                        if (dbStr === baseStr && dbStr !== newStr) {
                            fieldsToUpdate.push(field);
                            let valToSet = art[field];
                            if (['keyTakeaways', 'commonMistakes', 'prosCons', 'sources'].includes(field)) {
                                valToSet = valToSet ? JSON.stringify(valToSet) : null;
                            }
                            values.push(valToSet);
                        } else if (dbStr !== baseStr) {
                            console.log(`PRESERVED titular edit on ${art.slug}.${field}`);
                        }
                    }

                    if (fieldsToUpdate.length > 0) {
                        const setClauses = fieldsToUpdate.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
                        values.push(existing.id);
                        await db.query(
                            `UPDATE "EducationArticle" SET ${setClauses}, "updatedAt" = NOW() WHERE id = $${values.length}`,
                            values
                        );
                        updatedCount++;
                    } else {
                        preservedCount++;
                    }
                }
            }
        }

        console.log(`Safe sync completed: ${createdCount} created, ${updatedCount} updated, ${preservedCount} preserved.`);
    } finally {
        await db.end();
    }
})().catch(err => {
    console.error('Safe sync error:', err);
    process.exit(1);
});
