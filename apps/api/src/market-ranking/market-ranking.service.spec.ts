import { MarketRankingService } from './services/market-ranking.service';

describe('MarketRankingService Unit Tests', () => {
    let service: MarketRankingService;
    let mockPrisma: any;
    let mockProvider: any;
    let mockLogoService: any;

    beforeEach(() => {
        mockPrisma = {
            sP500Asset: {
                findMany: jest.fn(),
                createMany: jest.fn(),
                count: jest.fn(),
            },
            dailyMarketRanking: {
                upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
                findMany: jest.fn(),
                findFirst: jest.fn(),
            },
            marketRankingExecutionLog: {
                create: jest.fn().mockResolvedValue({ id: 'log-1' }),
            },
        };

        mockProvider = {
            providerName: 'MockProvider',
            getSP500Constituents: jest.fn(),
            getBatchQuotes: jest.fn(),
        };

        mockLogoService = {
            getCanonicalLogoUrl: jest.fn((ticker: string) => `https://images.financialmodelingprep.com/symbol/${ticker}.png`),
        };

        service = new MarketRankingService(mockPrisma, mockProvider, mockLogoService);
    });

    test('Test Caso Especificado: AAPL +2%, NVDA +8%, META +6%, MSFT +3%, AMD +7%, TSLA +1% => TOP 5: NVDA, AMD, META, MSFT, AAPL', async () => {
        const testConstituents = [
            { id: '1', ticker: 'AAPL', companyName: 'Apple Inc.', isActive: true },
            { id: '2', ticker: 'NVDA', companyName: 'NVIDIA Corp.', isActive: true },
            { id: '3', ticker: 'META', companyName: 'Meta Platforms Inc.', isActive: true },
            { id: '4', ticker: 'MSFT', companyName: 'Microsoft Corp.', isActive: true },
            { id: '5', ticker: 'AMD', companyName: 'Advanced Micro Devices', isActive: true },
            { id: '6', ticker: 'TSLA', companyName: 'Tesla Inc.', isActive: true },
        ];

        mockPrisma.sP500Asset.findMany.mockResolvedValue(testConstituents);

        const quotesMap = new Map([
            ['AAPL', { ticker: 'AAPL', price: 102, previousClose: 100, change: 2, changePercent: 2, volume: 50000000, timestamp: 1700000000 }],
            ['NVDA', { ticker: 'NVDA', price: 108, previousClose: 100, change: 8, changePercent: 8, volume: 80000000, timestamp: 1700000000 }],
            ['META', { ticker: 'META', price: 106, previousClose: 100, change: 6, changePercent: 6, volume: 20000000, timestamp: 1700000000 }],
            ['MSFT', { ticker: 'MSFT', price: 103, previousClose: 100, change: 3, changePercent: 3, volume: 30000000, timestamp: 1700000000 }],
            ['AMD',  { ticker: 'AMD',  price: 107, previousClose: 100, change: 7, changePercent: 7, volume: 45000000, timestamp: 1700000000 }],
            ['TSLA', { ticker: 'TSLA', price: 101, previousClose: 100, change: 1, changePercent: 1, volume: 60000000, timestamp: 1700000000 }],
        ]);

        mockProvider.getBatchQuotes.mockResolvedValue(quotesMap);

        const result = await service.executeDailyRanking('2026-09-13');

        expect(result.success).toBe(true);
        expect(result.topResults).toHaveLength(5);

        // Verification of descending order: NVDA (8%), AMD (7%), META (6%), MSFT (3%), AAPL (2%)
        expect(result.topResults[0].ticker).toBe('NVDA');
        expect(result.topResults[0].rank).toBe(1);
        expect(result.topResults[0].changePercent).toBe(8);

        expect(result.topResults[1].ticker).toBe('AMD');
        expect(result.topResults[1].rank).toBe(2);
        expect(result.topResults[1].changePercent).toBe(7);

        expect(result.topResults[2].ticker).toBe('META');
        expect(result.topResults[2].rank).toBe(3);
        expect(result.topResults[2].changePercent).toBe(6);

        expect(result.topResults[3].ticker).toBe('MSFT');
        expect(result.topResults[3].rank).toBe(4);
        expect(result.topResults[3].changePercent).toBe(3);

        expect(result.topResults[4].ticker).toBe('AAPL');
        expect(result.topResults[4].rank).toBe(5);
        expect(result.topResults[4].changePercent).toBe(2);
    });

    test('Discards invalid quotes (price <= 0, previousClose <= 0, volume <= 0)', async () => {
        const testConstituents = [
            { id: '1', ticker: 'VALID', companyName: 'Valid Inc.', isActive: true },
            { id: '2', ticker: 'BAD_PRICE', companyName: 'Bad Price Inc.', isActive: true },
            { id: '3', ticker: 'BAD_VOL', companyName: 'Bad Vol Inc.', isActive: true },
        ];

        mockPrisma.sP500Asset.findMany.mockResolvedValue(testConstituents);

        const quotesMap = new Map([
            ['VALID', { ticker: 'VALID', price: 50, previousClose: 40, change: 10, changePercent: 25, volume: 1000000, timestamp: 1700000000 }],
            ['BAD_PRICE', { ticker: 'BAD_PRICE', price: 0, previousClose: 40, change: -40, changePercent: -100, volume: 1000000, timestamp: 1700000000 }],
            ['BAD_VOL', { ticker: 'BAD_VOL', price: 50, previousClose: 40, change: 10, changePercent: 25, volume: 0, timestamp: 1700000000 }],
        ]);

        mockProvider.getBatchQuotes.mockResolvedValue(quotesMap);

        const result = await service.executeDailyRanking('2026-09-13');

        expect(result.topResults).toHaveLength(1);
        expect(result.topResults[0].ticker).toBe('VALID');
        expect(result.errors).toBe(2);
    });
});
