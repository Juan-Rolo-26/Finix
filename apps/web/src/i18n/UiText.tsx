import { useTranslation } from './index';

/** Translate only authored interface labels; never pass user content. */
export function UiText({ text }: { text: string }) {
    const { ui } = useTranslation();
    return <>{ui(text)}</>;
}
