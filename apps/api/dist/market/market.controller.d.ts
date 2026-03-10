import { MarketService } from './market.service';
export declare class MarketController {
    private marketService;
    constructor(marketService: MarketService);
    getTickers(): Promise<{
        symbol: string;
        price: number;
        change: number;
        volume: number;
    }[]>;
    getDashboard(): Promise<import("./market.service").MarketDashboardPayload>;
    search(q: any): Promise<any[]>;
    quote(q: any): Promise<import("./market.service").MarketQuote>;
    getFinvizHeatmap(q: any): Promise<unknown>;
    getDolarMep(): Promise<{
        compra: any;
        venta: any;
        fecha: any;
    }>;
    getNews(q: any): Promise<{
        title: string;
        link: string;
        publishedAt: string;
        source: string;
        summary: string;
    }[]>;
}
