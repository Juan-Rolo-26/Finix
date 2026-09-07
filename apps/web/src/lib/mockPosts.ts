// ─── Mock Posts Handler ───────────────────────────────────────────────────────
// Intercepts all /posts/* API calls and returns mock data from localStorage.
// This lets the Explorar page work fully offline without the NestJS backend.

export type MockPost = {
    id: string;
    content: string;
    type: 'post' | 'image' | 'reel' | 'chart';
    assetSymbol?: string;
    analysisType?: string;
    riskLevel?: string;
    mediaUrl?: string;
    media: { id: string; url: string; mediaType: 'image' | 'video'; order: number }[];
    author: { id: string; username: string; avatarUrl?: string; isVerified?: boolean };
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    savesCount: number;
    likedByMe: boolean;
    repostedByMe: boolean;
    savedByMe: boolean;
    contentEditedAt?: string;
    createdAt: string;
    tickers?: string;
    quotedPost?: MockPost;
};

const DB_KEY = 'mockPostsDb';
const LIKES_KEY = 'mockPostsLikes';
const SAVES_KEY = 'mockPostsSaves';
const REPOSTS_KEY = 'mockPostsReposts';
const COMMENTS_KEY = 'mockPostsComments';

function getDb(): MockPost[] {
    let db = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seedDb();

    const purged = db.filter((p: MockPost) => p.author?.id === 'current-user');
    if (purged.length !== db.length) {
        db = purged;
        saveDb(db);
    }
    return db;
}

function saveDb(db: MockPost[]) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getLikes(): Record<string, boolean> {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
}
function getSaves(): Record<string, boolean> {
    return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}');
}
function getReposts(): Record<string, boolean> {
    return JSON.parse(localStorage.getItem(REPOSTS_KEY) || '{}');
}
function getComments(): Record<string, { id: string; content: string; author: { id: string; username: string }; createdAt: string }[]> {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
}


function seedDb(): MockPost[] {
    const hasSeeded = localStorage.getItem('hasSeededPostsV2');
    if (!hasSeeded) {
        localStorage.setItem('hasSeededPostsV2', 'true');
        return [];
    }
    return [];
}

function applyUserStates(posts: MockPost[]): MockPost[] {
    const likes = getLikes();
    const saves = getSaves();
    const reposts = getReposts();
    return posts.map((p) => ({
        ...p,
        likedByMe: !!likes[p.id],
        savedByMe: !!saves[p.id],
        repostedByMe: !!reposts[p.id],
    }));
}

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

export async function handleMockPosts(path: string, init?: RequestInit): Promise<Response | null> {
    const method = (init?.method || 'GET').toUpperCase();

    // GET /posts/feed
    if ((path === '/posts/feed' || path.startsWith('/posts/feed?')) && method === 'GET') {
        const qs = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : new URLSearchParams();
        const sort = qs.get('sort') || 'recent';
        const typeFilter = qs.get('type') || '';
        const limit = parseInt(qs.get('limit') || '15', 10);

        let db = applyUserStates(getDb());

        if (typeFilter) {
            db = db.filter((p) => p.type === typeFilter);
        }

        if (sort === 'popular') {
            db = [...db].sort((a, b) => b.likesCount - a.likesCount);
        } else if (sort === 'trending') {
            db = [...db].sort((a, b) => (b.likesCount + b.repostsCount * 2) - (a.likesCount + a.repostsCount * 2));
        } else if (sort === 'following') {
            // Return a subset to simulate "following" feed
            db = db.filter((_, i) => i % 2 === 0);
        } else {
            // recent: newest first
            db = [...db].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const sliced = db.slice(0, limit);
        return json({ posts: sliced, nextCursor: null, hasMore: false });
    }

    // GET /posts/saved
    if (path === '/posts/saved' && method === 'GET') {
        const db = applyUserStates(getDb());
        const saved = db.filter((p) => p.savedByMe);
        return json({ posts: saved, nextCursor: null, hasMore: false });
    }

    // GET /posts
    if ((path === '/posts' || path.startsWith('/posts?')) && method === 'GET') {
        let db = applyUserStates(getDb());
        db = [...db].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return json(db);
    }

    // POST /posts/upload-media
    if (path === '/posts/upload-media' && method === 'POST') {
        let dummyUrl = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCBTC--big.svg';
        try {
            if (init?.body instanceof FormData) {
                const file = init.body.get('files') as File;
                if (file) {
                    dummyUrl = URL.createObjectURL(file);
                }
            }
        } catch (e) { }
        return json([{
            url: dummyUrl,
            mediaType: 'image',
            mimeType: 'image/png',
            sizeBytes: 1000
        }], 201);
    }

    // POST /posts (create)
    if (path === '/posts' && method === 'POST') {
        const body = JSON.parse((init?.body as string) || '{}');
        const db = getDb();
        const newPost: MockPost = {
            id: `mock-p${Date.now()}`,
            type: body.type || body.postType || 'post',
            content: body.content || '',
            tickers: Array.isArray(body.tickers) ? body.tickers.join(', ') : body.tickers || '',
            assetSymbol: body.assetSymbol,
            analysisType: body.analysisType,
            riskLevel: body.riskLevel,
            media: Array.isArray(body.mediaUrls) ? body.mediaUrls.map((item: any) => ({ url: typeof item === 'string' ? item : item.url, mediaType: 'image' })) : [],
            author: { id: 'current-user', username: 'vos' },
            likesCount: 0,
            commentsCount: 0,
            repostsCount: 0,
            savesCount: 0,
            likedByMe: false,
            repostedByMe: false,
            savedByMe: false,
            createdAt: new Date().toISOString(),
        };
        db.unshift(newPost);
        saveDb(db);
        return json(newPost, 201);
    }

    // POST /posts/:id/like
    const likeMatch = path.match(/^\/posts\/([^/]+)\/like$/);
    if (likeMatch && method === 'POST') {
        const id = likeMatch[1];
        const likes = getLikes();
        const db = getDb();
        const post = db.find((p) => p.id === id);
        if (post) {
            likes[id] = !likes[id];
            post.likesCount += likes[id] ? 1 : -1;
            localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
            saveDb(db);
        }
        return json({ liked: !!likes[id] });
    }

    // POST /posts/:id/save
    const saveMatch = path.match(/^\/posts\/([^/]+)\/save$/);
    if (saveMatch && method === 'POST') {
        const id = saveMatch[1];
        const saves = getSaves();
        const db = getDb();
        const post = db.find((p) => p.id === id);
        if (post) {
            saves[id] = !saves[id];
            post.savesCount += saves[id] ? 1 : -1;
            localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
            saveDb(db);
        }
        return json({ saved: !!saves[id] });
    }

    // POST /posts/:id/repost
    const repostMatch = path.match(/^\/posts\/([^/]+)\/repost$/);
    if (repostMatch && method === 'POST') {
        const id = repostMatch[1];
        const reposts = getReposts();
        const db = getDb();
        const post = db.find((p) => p.id === id);
        if (post) {
            reposts[id] = !reposts[id];
            post.repostsCount += reposts[id] ? 1 : -1;
            localStorage.setItem(REPOSTS_KEY, JSON.stringify(reposts));
            saveDb(db);
        }
        return json({ reposted: !!reposts[id] });
    }


    // POST /posts/comment/:id/like (must come before generic /posts/:id DELETE)
    const commentLikeMatch = path.match(/^\/posts\/comment\/([^/]+)\/like$/);
    if (commentLikeMatch && method === 'POST') {
        return json({ liked: true });
    }

    // DELETE /posts/comment/:id (must come before generic /posts/:id DELETE)
    const commentDeleteMatch = path.match(/^\/posts\/comment\/([^/]+)$/);
    if (commentDeleteMatch && method === 'DELETE') {
        return json({ success: true, removedCount: 1 });
    }

    // DELETE /posts/:id
    const deleteMatch = path.match(/^\/posts\/([^/]+)$/);
    if (deleteMatch && method === 'DELETE') {
        const id = deleteMatch[1];
        const db = getDb().filter((p) => p.id !== id);
        saveDb(db);
        return json({ success: true });
    }

    // GET /posts/:id/comments
    const commentsGetMatch = path.match(/^\/posts\/([^/]+)\/comments/);
    if (commentsGetMatch && method === 'GET') {
        const id = commentsGetMatch[1];
        const allComments = getComments();
        const comments = (allComments[id] || []).map((c) => ({
            ...c,
            likesCount: 0,
            repliesCount: 0,
            likedByMe: false,
            replies: [],
        }));
        return json({ comments, nextCursor: null, hasMore: false, totalCount: comments.length });
    }

    // POST /posts/:id/comment  (singular - CommentsPanel)
    const commentSingularMatch = path.match(/^\/posts\/([^/]+)\/comment$/);
    if (commentSingularMatch && method === 'POST') {
        const id = commentSingularMatch[1];
        const body = JSON.parse((init?.body as string) || '{}');
        const allComments = getComments();
        const newComment = {
            id: `cmnt-${Date.now()}`,
            content: body.content || '',
            author: { id: 'current-user', username: 'vos' },
            createdAt: new Date().toISOString(),
        };
        allComments[id] = [newComment, ...(allComments[id] || [])];
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
        const db = getDb();
        const post = db.find((p) => p.id === id);
        if (post) { post.commentsCount += 1; saveDb(db); }
        return json(newComment, 201);
    }

    // POST /posts/:id/comments  (plural)
    const commentsPluralMatch = path.match(/^\/posts\/([^/]+)\/comments$/);
    if (commentsPluralMatch && method === 'POST') {
        const id = commentsPluralMatch[1];
        const body = JSON.parse((init?.body as string) || '{}');
        const allComments = getComments();
        const newComment = {
            id: `cmnt-${Date.now()}`,
            content: body.content || '',
            author: { id: 'current-user', username: 'vos' },
            createdAt: new Date().toISOString(),
        };
        allComments[id] = [newComment, ...(allComments[id] || [])];
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
        const db = getDb();
        const post = db.find((p) => p.id === id);
        if (post) { post.commentsCount += 1; saveDb(db); }
        return json(newComment, 201);
    }


    // PATCH /posts/:id (edit)
    const patchMatch = path.match(/^\/posts\/([^/]+)$/);
    if (patchMatch && method === 'PATCH') {
        const id = patchMatch[1];
        const body = JSON.parse((init?.body as string) || '{}');
        const db = getDb();
        const idx = db.findIndex((p) => p.id === id);
        if (idx !== -1) {
            db[idx] = { ...db[idx], ...body, contentEditedAt: new Date().toISOString() };
            saveDb(db);
            return json(db[idx]);
        }
        return json({ error: 'Not found' }, 404);
    }

    // POST /posts/:id/report
    const reportMatch = path.match(/^\/posts\/([^/]+)\/report$/);
    if (reportMatch && method === 'POST') {
        return json({ success: true });
    }

    return null;
}
