import { MarketService } from './market.service';
export declare class MarketController {
    private marketService;
    constructor(marketService: MarketService);
    getTickers(): {
        price: number;
        change: number;
        symbol: string;
    }[];
    search(q: any): Promise<any[]>;
    quote(q: any): Promise<import("./market.service").MarketQuote>;
    getFinvizHeatmap(q: any): Promise<unknown>;
    getDolarMep(): Promise<{
        compra: any;
        venta: any;
        fecha: any;
    }>;
    getNews(q: any): Promise<import("./market.service").NewsItem[]>;
}
