import { Globe2, MapPin } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const POPULAR_LOCATIONS = [
    'Argentina',
    'Cordoba, Argentina',
    'Buenos Aires, Argentina',
    'Rosario, Argentina',
    'Mendoza, Argentina',
    'Montevideo, Uruguay',
    'Santiago, Chile',
    'Sao Paulo, Brasil',
    'Ciudad de Mexico, Mexico',
    'Bogota, Colombia',
    'Lima, Peru',
    'Asuncion, Paraguay',
    'Madrid, Espana',
    'Barcelona, Espana',
    'Miami, Estados Unidos',
    'New York, Estados Unidos',
];

const QUICK_PICKS = [
    'Argentina',
    'Cordoba, Argentina',
    'Buenos Aires, Argentina',
    'Montevideo, Uruguay',
    'Madrid, Espana',
    'Miami, Estados Unidos',
];

const CLEAR_LOCATION_VALUE = '__clear_location__';

type LocationQuickSelectProps = {
    id?: string;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    quickPicks?: string[];
    suggestions?: string[];
};

export default function LocationQuickSelect({
    value,
    onChange,
    quickPicks = QUICK_PICKS,
    suggestions = POPULAR_LOCATIONS,
    id,
    className,
    disabled,
    placeholder = 'Selecciona una ubicacion',
}: LocationQuickSelectProps) {
    const uniqueQuickPicks = Array.from(new Set(quickPicks));
    const uniqueSuggestions = Array.from(new Set(suggestions));
    const currentValue = value.trim();
    const hasCustomValue =
        currentValue.length > 0 &&
        !uniqueQuickPicks.includes(currentValue) &&
        !uniqueSuggestions.includes(currentValue);
    const additionalSuggestions = uniqueSuggestions.filter((option) => !uniqueQuickPicks.includes(option));

    return (
        <Select value={currentValue || undefined} onValueChange={(nextValue) => onChange(nextValue === CLEAR_LOCATION_VALUE ? '' : nextValue)}>
            <SelectTrigger
                id={id}
                disabled={disabled}
                className={cn('justify-start gap-2 text-left', className)}
            >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm">
                <SelectGroup>
                    <SelectLabel>Seleccion</SelectLabel>
                    <SelectItem value={CLEAR_LOCATION_VALUE}>
                        <span className="flex items-center gap-2">
                            <Globe2 className="h-4 w-4 text-primary" />
                            Sin seleccionar
                        </span>
                    </SelectItem>
                </SelectGroup>

                {hasCustomValue && (
                    <>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>Actual</SelectLabel>
                            <SelectItem value={currentValue}>
                                <span className="flex items-center gap-2">
                                    {currentValue.includes(',') ? (
                                        <MapPin className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Globe2 className="h-4 w-4 text-primary" />
                                    )}
                                    {currentValue}
                                </span>
                            </SelectItem>
                        </SelectGroup>
                    </>
                )}

                <SelectSeparator />
                <SelectGroup>
                    <SelectLabel>Sugeridas</SelectLabel>
                    {uniqueQuickPicks.map((option) => (
                        <SelectItem key={option} value={option}>
                            <span className="flex items-center gap-2">
                                {option.includes(',') ? (
                                    <MapPin className="h-4 w-4 text-primary" />
                                ) : (
                                    <Globe2 className="h-4 w-4 text-primary" />
                                )}
                                {option}
                            </span>
                        </SelectItem>
                    ))}
                </SelectGroup>

                {additionalSuggestions.length > 0 && (
                    <>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>Mas opciones</SelectLabel>
                            {additionalSuggestions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    <span className="flex items-center gap-2">
                                        {option.includes(',') ? (
                                            <MapPin className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Globe2 className="h-4 w-4 text-primary" />
                                        )}
                                        {option}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </>
                )}
            </SelectContent>
        </Select>
    );
}
