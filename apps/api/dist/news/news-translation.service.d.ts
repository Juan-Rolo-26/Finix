export declare class NewsTranslationService {
    isEnglish(text: string): boolean;
    translateToSpanish(text: string): Promise<string>;
    private translateWithLibreTranslate;
    private translateWithMyMemory;
    translateBatch(texts: string[]): Promise<string[]>;
    private basicFinancialTranslation;
}
