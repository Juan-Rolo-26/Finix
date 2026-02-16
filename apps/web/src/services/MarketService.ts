export class MarketService {
    // Mock database of popular assets for the search
    private static ASSETS = [
        { symbol: "AAPL", name: "Apple Inc.", type: "Stock", price: 175.84, currency: "USD" },
        { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock", price: 402.12, currency: "USD" },
        { symbol: "GOOGL", name: "Alphabet Inc.", type: "Stock", price: 145.32, currency: "USD" },
        { symbol: "AMZN", name: "Amazon.com Inc.", type: "Stock", price: 178.22, currency: "USD" },
        { symbol: "TSLA", name: "Tesla Inc.", type: "Stock", price: 202.64, currency: "USD" },
        { symbol: "BTC", name: "Bitcoin", type: "Crypto", price: 52100.00, currency: "USD" },
        { symbol: "ETH", name: "Ethereum", type: "Crypto", price: 2900.00, currency: "USD" },
        { symbol: "SOL", name: "Solana", type: "Crypto", price: 110.50, currency: "USD" },
        { symbol: "NVDA", name: "NVIDIA Corp", type: "Stock", price: 785.30, currency: "USD" },
        { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF", price: 508.00, currency: "USD" },
    ];

    static async searchAssets(query: string) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!query) return [];

        const lowerQuery = query.toLowerCase();
        return this.ASSETS.filter(a =>
            a.symbol.toLowerCase().includes(lowerQuery) ||
            a.name.toLowerCase().includes(lowerQuery)
        );
    }
}
