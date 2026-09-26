type TradingViewCanvas = HTMLCanvasElement & {
    toBlob?: HTMLCanvasElement['toBlob'];
};

function wait(milliseconds: number) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('chart-capture-timeout')), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
}

/**
 * TradingView can resolve a canvas while it is still painting the chart. A
 * non-transparent canvas is not enough: loading screens and empty panes also
 * contain pixels. Reject captures that are effectively a flat background.
 */
function isMeaningfulChartCanvas(canvas: TradingViewCanvas) {
    if (!canvas.width || !canvas.height) return false;

    try {
        const context = canvas.getContext('2d');
        if (!context) return false;

        const stepX = Math.max(1, Math.floor(canvas.width / 48));
        const stepY = Math.max(1, Math.floor(canvas.height / 32));
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const colors = new Set<string>();
        const luminances: number[] = [];
        let visiblePixels = 0;
        let samples = 0;

        for (let y = 0; y < canvas.height; y += stepY) {
            for (let x = 0; x < canvas.width; x += stepX) {
                const offset = (y * canvas.width + x) * 4;
                const alpha = image.data[offset + 3];
                if (alpha <= 30) continue;

                const red = image.data[offset];
                const green = image.data[offset + 1];
                const blue = image.data[offset + 2];
                colors.add(`${red >> 4}-${green >> 4}-${blue >> 4}`);
                luminances.push((red * 0.299) + (green * 0.587) + (blue * 0.114));
                visiblePixels += 1;
                samples += 1;
            }
        }

        if (!samples || visiblePixels / Math.max(1, (canvas.width / stepX) * (canvas.height / stepY)) < 0.45) {
            return false;
        }

        const average = luminances.reduce((sum, value) => sum + value, 0) / luminances.length;
        const variance = luminances.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / luminances.length;

        // A real chart has grid, labels, candles/lines or drawings. A pane
        // with only two flat colors is a transient/empty TradingView render.
        return colors.size >= 8 && Math.sqrt(variance) >= 4;
    } catch {
        // Some TradingView builds expose a cross-origin canvas. In that case
        // the browser prevents pixel inspection; dimensions are our fallback.
        return canvas.width >= 320 && canvas.height >= 180;
    }
}

export async function captureTradingViewCanvas(widget: any, timeoutMs = 12000): Promise<HTMLCanvasElement | null> {
    if (!widget) return null;

    const methods = [
        typeof widget.takeClientScreenshot === 'function'
            ? () => widget.takeClientScreenshot()
            : null,
        typeof widget.imageCanvas === 'function'
            ? () => widget.imageCanvas()
            : null,
    ].filter((method): method is () => Promise<TradingViewCanvas> => Boolean(method));

    // Give the chart a moment after onChartReady for candles, labels and user
    // drawings to finish painting, then retry transient empty captures.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        for (const capture of methods) {
            try {
                const canvas = await withTimeout(Promise.resolve(capture()), timeoutMs);
                if (canvas && typeof canvas.toBlob === 'function' && isMeaningfulChartCanvas(canvas)) {
                    return canvas;
                }
            } catch {
                // Try the other TradingView method and the next paint cycle.
            }
        }
        if (attempt < 2) await wait(900);
    }

    return null;
}
