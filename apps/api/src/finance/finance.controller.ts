import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    CreateFinanceAccountDto,
    CreateFinanceBudgetDto,
    CreateFinanceCardDto,
    CreateFinanceGoalDto,
    CreateFinanceRecurringDto,
    CreateFinanceTransactionDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@Controller('personal-finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private readonly finance: FinanceService) {}

    private userId(request: any) { return request.user.id; }

    @Get('snapshot') snapshot(@Request() request: any, @Query('currency') currency?: string) { return this.finance.getSnapshot(this.userId(request), currency); }

    @Get('accounts') accounts(@Request() request: any) { return this.finance.listAccounts(this.userId(request)); }
    @Post('accounts') createAccount(@Request() request: any, @Body() body: CreateFinanceAccountDto) { return this.finance.createAccount(this.userId(request), body); }
    @Patch('accounts/:id') updateAccount(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateAccount(this.userId(request), id, body); }
    @Post('accounts/:id/sync') syncAccount(@Request() request: any, @Param('id') id: string) { return this.finance.syncAccount(this.userId(request), id); }
    @Delete('accounts/:id') deleteAccount(@Request() request: any, @Param('id') id: string) { return this.finance.deleteAccount(this.userId(request), id); }

    @Get('transactions') transactions(@Request() request: any) { return this.finance.listTransactions(this.userId(request)); }
    @Post('transactions') createTransaction(@Request() request: any, @Body() body: CreateFinanceTransactionDto) { return this.finance.createTransaction(this.userId(request), body); }
    @Patch('transactions/:id') updateTransaction(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateTransaction(this.userId(request), id, body); }
    @Delete('transactions/:id') deleteTransaction(@Request() request: any, @Param('id') id: string) { return this.finance.deleteTransaction(this.userId(request), id); }

    @Get('budgets') budgets(@Request() request: any) { return this.finance.listBudgets(this.userId(request)); }
    @Post('budgets') createBudget(@Request() request: any, @Body() body: CreateFinanceBudgetDto) { return this.finance.createBudget(this.userId(request), body); }
    @Patch('budgets/:id') updateBudget(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateBudget(this.userId(request), id, body); }
    @Delete('budgets/:id') deleteBudget(@Request() request: any, @Param('id') id: string) { return this.finance.deleteBudget(this.userId(request), id); }

    @Get('goals') goals(@Request() request: any) { return this.finance.listGoals(this.userId(request)); }
    @Post('goals') createGoal(@Request() request: any, @Body() body: CreateFinanceGoalDto) { return this.finance.createGoal(this.userId(request), body); }
    @Patch('goals/:id') updateGoal(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateGoal(this.userId(request), id, body); }
    @Delete('goals/:id') deleteGoal(@Request() request: any, @Param('id') id: string) { return this.finance.deleteGoal(this.userId(request), id); }

    @Get('recurring') recurring(@Request() request: any) { return this.finance.listRecurring(this.userId(request)); }
    @Post('recurring') createRecurring(@Request() request: any, @Body() body: CreateFinanceRecurringDto) { return this.finance.createRecurring(this.userId(request), body); }
    @Patch('recurring/:id') updateRecurring(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateRecurring(this.userId(request), id, body); }
    @Delete('recurring/:id') deleteRecurring(@Request() request: any, @Param('id') id: string) { return this.finance.deleteRecurring(this.userId(request), id); }

    @Get('cards') cards(@Request() request: any) { return this.finance.listCards(this.userId(request)); }
    @Post('cards') createCard(@Request() request: any, @Body() body: CreateFinanceCardDto) { return this.finance.createCard(this.userId(request), body); }
    @Patch('cards/:id') updateCard(@Request() request: any, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.finance.updateCard(this.userId(request), id, body); }
    @Delete('cards/:id') deleteCard(@Request() request: any, @Param('id') id: string) { return this.finance.deleteCard(this.userId(request), id); }
}
