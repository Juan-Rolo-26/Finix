import { WebSearchResult } from '../services/web-search.service';
export declare function buildWebAnalysisPrompt(params: {
    query: string;
    context?: string;
    searchResults: WebSearchResult[];
}): {
    system: string;
    prompt: string;
};
export declare function buildAssetWebPrompt(params: {
    ticker: string;
    question?: string;
    searchResults: WebSearchResult[];
}): {
    system: string;
    prompt: string;
};
