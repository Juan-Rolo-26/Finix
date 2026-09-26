import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const currencies = ['ARS', 'USD', 'EUR'] as const;
const accountKinds = ['bank', 'wallet', 'cash', 'broker', 'credit'] as const;
const transactionTypes = ['income', 'expense', 'transfer', 'investment'] as const;
const transactionStatuses = ['confirmed', 'pending'] as const;

export class CreateFinanceAccountDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    institution?: string;

    @IsOptional()
    @IsIn(accountKinds)
    kind?: typeof accountKinds[number];

    @IsOptional()
    @IsIn(currencies)
    currency?: typeof currencies[number];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsBoolean()
    hidden?: boolean;
}

export class UpdateFinanceAccountDto extends CreateFinanceAccountDto {}

export class CreateFinanceTransactionDto {
    @IsString()
    description!: string;

    @IsOptional()
    @IsString()
    merchant?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    categoryKey?: string;

    @IsIn(transactionTypes)
    type!: typeof transactionTypes[number];

    @Type(() => Number)
    @IsNumber()
    amount!: number;

    @IsOptional()
    @IsIn(currencies)
    currency?: typeof currencies[number];

    @IsOptional()
    @IsIn(transactionStatuses)
    status?: typeof transactionStatuses[number];

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsString()
    accountId?: string;

    @IsOptional()
    @IsString()
    cardId?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateFinanceTransactionDto extends CreateFinanceTransactionDto {}

export class CreateFinanceBudgetDto {
    @IsString()
    category!: string;

    @IsString()
    categoryKey!: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    limit!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2020)
    year?: number;
}

export class UpdateFinanceBudgetDto extends CreateFinanceBudgetDto {}

export class CreateFinanceGoalDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    target!: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    saved?: number;

    @IsOptional()
    @IsIn(currencies)
    currency?: typeof currencies[number];

    @IsOptional()
    @IsDateString()
    deadline?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    monthlyContribution?: number;
}

export class UpdateFinanceGoalDto extends CreateFinanceGoalDto {}

export class CreateFinanceRecurringDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    category?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    amount!: number;

    @IsOptional()
    @IsIn(currencies)
    currency?: typeof currencies[number];

    @IsDateString()
    nextDate!: string;

    @IsOptional()
    @IsString()
    frequency?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsString()
    accountId?: string;
}

export class UpdateFinanceRecurringDto extends CreateFinanceRecurringDto {}

export class CreateFinanceCardDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    last4?: string;

    @IsOptional()
    @IsIn(currencies)
    currency?: typeof currencies[number];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    creditLimit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    currentBalance?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(31)
    closingDay?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(31)
    dueDay?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsString()
    accountId?: string;
}

export class UpdateFinanceCardDto extends CreateFinanceCardDto {}
