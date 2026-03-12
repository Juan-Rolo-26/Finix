import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { MarketService } from '../market/market.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private marketService: MarketService,
    ) { }

    private normalizeTicker(value?: string | null) {
        return String(value || '').trim().toUpperCase();
    }

    private roundMetric(value: number, fractionDigits = 2) {
        return Number(value.toFixed(fractionDigits));
    }

    private normalizeCurrency(value?: string | null) {
        return String(value || 'USD').trim().toUpperCase() || 'USD';
    }

    private sortTransactionsChronologically<T extends { date?: Date | string | null; createdAt?: Date | string | null; id?: string | null }>(transactions: T[]) {
        return [...transactions].sort((left, right) => {
            const leftDate = left?.date ? new Date(left.date).getTime() : 0;
            const rightDate = right?.date ? new Date(right.date).getTime() : 0;

            if (leftDate !== rightDate) {
                return leftDate - rightDate;
            }

            const leftCreatedAt = left?.createdAt ? new Date(left.createdAt).getTime() : leftDate;
            const rightCreatedAt = right?.createdAt ? new Date(right.createdAt).getTime() : rightDate;

            if (leftCreatedAt !== rightCreatedAt) {
                return leftCreatedAt - rightCreatedAt;
            }

            return String(left?.id || '').localeCompare(String(right?.id || ''));
        });
    }

    private addToBalanceMap(target: Map<string, number>, currency: string, amount: number) {
        if (!currency || !Number.isFinite(amount) || Math.abs(amount) <= 1e-8) {
            return;
        }

        target.set(currency, (target.get(currency) ?? 0) + amount);
    }

    private sumBalanceMap(target: Map<string, number>) {
        return Array.from(target.values()).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
    }

    private getTransactionCashDelta(transaction: {
        type?: string | null;
        total?: Prisma.Decimal | number | null;
        fee?: Prisma.Decimal | number | null;
        currency?: string | null;
        date?: Date | string | null;
    }) {
        const type = String(transaction?.type ?? '').toUpperCase();
        const total = Number(transaction?.total ?? 0);
        const fee = Number(transaction?.fee ?? 0);
        const currency = this.normalizeCurrency(transaction?.currency);

        let amount = 0;
        if (type === 'BUY') amount = -(total + fee);
        if (type === 'SELL') amount = total - fee;
        if (type === 'DIVIDEND') amount = total;
        if (type === 'DEPOSIT') amount = total;
        if (type === 'WITHDRAW') amount = -total;
        if (type === 'FEE') amount = -total;

        if (!Number.isFinite(amount) || Math.abs(amount) <= 1e-8) {
            return null;
        }

        return {
            type,
            currency,
            amount,
            date: transaction?.date ? new Date(transaction.date) : new Date(),
        };
    }

    private buildCurrentHoldingMap(holdings: Array<{
        quantity?: Prisma.Decimal | number | null;
        asset?: { ticker?: string | null } | null;
    }>) {
        const currentHoldings = new Map<string, number>();

        for (const holding of holdings ?? []) {
            const ticker = this.normalizeTicker(holding.asset?.ticker);
            if (!ticker) continue;

            currentHoldings.set(ticker, Number(holding.quantity ?? 0));
        }

        return currentHoldings;
    }

    private buildBaselineHoldingMap(
        holdings: Array<{
            quantity?: Prisma.Decimal | number | null;
            asset?: { ticker?: string | null } | null;
        }>,
        transactions: Array<{
            type?: string | null;
            quantity?: Prisma.Decimal | number | null;
            asset?: { ticker?: string | null } | null;
        }>,
    ) {
        const currentHoldings = this.buildCurrentHoldingMap(holdings);
        const transactionHoldings = new Map<string, number>();

        for (const transaction of transactions ?? []) {
            const ticker = this.normalizeTicker(transaction.asset?.ticker);
            if (!ticker) continue;

            const quantity = Number(transaction.quantity ?? 0);
            const current = transactionHoldings.get(ticker) ?? 0;

            if (String(transaction.type ?? '').toUpperCase() === 'BUY') {
                transactionHoldings.set(ticker, current + quantity);
            } else if (String(transaction.type ?? '').toUpperCase() === 'SELL') {
                transactionHoldings.set(ticker, current - quantity);
            }
        }

        const baseline = new Map<string, number>();
        const tickers = new Set([...currentHoldings.keys(), ...transactionHoldings.keys()]);

        tickers.forEach((ticker) => {
            const diff = (currentHoldings.get(ticker) ?? 0) - (transactionHoldings.get(ticker) ?? 0);
            if (Math.abs(diff) > 1e-8) {
                baseline.set(ticker, diff);
            }
        });

        return baseline;
    }

    private buildCurrentCashMap(cashAccounts: Array<{ currency?: string | null; balance?: Prisma.Decimal | number | null }>) {
        const currentCash = new Map<string, number>();

        for (const account of cashAccounts ?? []) {
            const currency = this.normalizeCurrency(account.currency);
            this.addToBalanceMap(currentCash, currency, Number(account.balance ?? 0));
        }

        return currentCash;
    }

    private buildBaselineCashMap(
        cashAccounts: Array<{ currency?: string | null; balance?: Prisma.Decimal | number | null }>,
        transactions: Array<{
            type?: string | null;
            total?: Prisma.Decimal | number | null;
            fee?: Prisma.Decimal | number | null;
            currency?: string | null;
            date?: Date | string | null;
        }>,
    ) {
        const baselineCash = this.buildCurrentCashMap(cashAccounts);

        for (const transaction of transactions ?? []) {
            const delta = this.getTransactionCashDelta(transaction);
            if (!delta) continue;

            this.addToBalanceMap(baselineCash, delta.currency, -delta.amount);
        }

        return baselineCash;
    }

    private buildSyntheticFundingTotal(
        transactions: Array<{
            type?: string | null;
            total?: Prisma.Decimal | number | null;
            fee?: Prisma.Decimal | number | null;
            currency?: string | null;
            date?: Date | string | null;
            createdAt?: Date | string | null;
            id?: string | null;
        }>,
        baselineCash: Map<string, number>,
    ) {
        const runningBalances = new Map<string, number>();
        let syntheticFundingTotal = 0;

        baselineCash.forEach((balance, currency) => {
            if (!Number.isFinite(balance)) {
                return;
            }

            if (balance < 0) {
                syntheticFundingTotal += Math.abs(balance);
                runningBalances.set(currency, 0);
                return;
            }

            runningBalances.set(currency, balance);
        });

        for (const transaction of this.sortTransactionsChronologically(transactions ?? [])) {
            const delta = this.getTransactionCashDelta(transaction);
            if (!delta) continue;

            const currentBalance = runningBalances.get(delta.currency) ?? 0;
            const nextBalance = currentBalance + delta.amount;

            if (nextBalance < 0) {
                syntheticFundingTotal += Math.abs(nextBalance);
                runningBalances.set(delta.currency, 0);
                continue;
            }

            runningBalances.set(delta.currency, nextBalance);
        }

        return syntheticFundingTotal;
    }

    private async buildQuotePriceMap(
        holdings: Array<{ asset?: { ticker?: string | null } | null }>
    ) {
        const quoteMap = new Map<string, number>();
        const tickers = Array.from(
            new Set(
                holdings
                    .map((holding) => this.normalizeTicker(holding.asset?.ticker))
                    .filter(Boolean)
            )
        );

        if (tickers.length === 0) {
            return quoteMap;
        }

        try {
            const quotes = await this.marketService.getQuotes(tickers);
            quotes.forEach((quote) => {
                const ticker = this.normalizeTicker(quote.inputSymbol);
                if (!ticker || typeof quote.price !== 'number') return;
                quoteMap.set(ticker, quote.price);
            });
        } catch (error) {
            console.error('[UserService] Failed to load live quotes for trader ranking:', error);
        }

        return quoteMap;
    }

    private calculateRiskScore(holdings: Array<{ asset?: { ticker?: string | null } | null }>) {
        if (holdings.length === 0) {
            return 5.0;
        }

        const uniqueTickers = new Set(
            holdings
                .map((holding) => this.normalizeTicker(holding.asset?.ticker))
                .filter(Boolean)
        ).size;

        return this.roundMetric(Math.min(10, Math.max(1, 10 - (uniqueTickers / 2))), 1);
    }

    private computePortfolioStatsFromPortfolios(
        portfolios: Array<{
            holdings?: Array<{
                quantity?: Prisma.Decimal | number | null;
                averageCost?: Prisma.Decimal | number | null;
                asset?: { ticker?: string | null } | null;
            }>;
            transactions?: Array<{
                type?: string | null;
                date?: Date | string | null;
                createdAt?: Date | string | null;
                id?: string | null;
                quantity?: Prisma.Decimal | number | null;
                total?: Prisma.Decimal | number | null;
                fee?: Prisma.Decimal | number | null;
                currency?: string | null;
                pricePerUnit?: Prisma.Decimal | number | null;
                asset?: { ticker?: string | null } | null;
            }>;
            cashAccounts?: Array<{
                currency?: string | null;
                balance?: Prisma.Decimal | number | null;
            }>;
        }>,
        quoteMap: Map<string, number>,
    ) {
        if (portfolios.length === 0) {
            return {
                totalReturn: null,
                winRate: null,
                riskScore: null,
            };
        }

        let capitalTotal = 0;
        let valorActual = 0;
        let winningPositions = 0;
        let evaluatedPositions = 0;
        const allHoldings: Array<{ asset?: { ticker?: string | null } | null }> = [];

        portfolios.forEach((portfolio) => {
            const transactions = this.sortTransactionsChronologically(portfolio.transactions ?? []);
            const baselineHoldings = this.buildBaselineHoldingMap(portfolio.holdings ?? [], transactions);
            const baselineCash = this.buildBaselineCashMap(portfolio.cashAccounts ?? [], transactions);
            const syntheticFundingTotal = this.buildSyntheticFundingTotal(transactions, baselineCash);
            const initialCashContribution = Array.from(baselineCash.values()).reduce((total, balance) => (
                balance > 0 ? total + balance : total
            ), 0);
            const explicitNetDeposits = transactions.reduce((total, transaction) => {
                const type = String(transaction.type ?? '').toUpperCase();
                const amount = Number(transaction.total ?? 0);

                if (type === 'DEPOSIT') return total + amount;
                if (type === 'WITHDRAW') return total - amount;
                return total;
            }, 0);

            (portfolio.holdings ?? []).forEach((holding) => {
                const quantity = Number(holding.quantity || 0);
                if (quantity <= 0) {
                    return;
                }

                const averageCost = Number(holding.averageCost || 0);
                const ticker = this.normalizeTicker(holding.asset?.ticker);
                const livePrice = ticker ? quoteMap.get(ticker) : undefined;
                const currentPrice = typeof livePrice === 'number' ? livePrice : averageCost;
                const invested = quantity * averageCost;
                const currentValue = quantity * currentPrice;

                valorActual += currentValue;

                if (invested > 0) {
                    evaluatedPositions += 1;
                    if (currentValue > invested) {
                        winningPositions += 1;
                    }
                }

                allHoldings.push(holding);
            });

            baselineHoldings.forEach((quantity, ticker) => {
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return;
                }

                const livePrice = quoteMap.get(ticker);
                const matchingHolding = (portfolio.holdings ?? []).find((holding) => this.normalizeTicker(holding.asset?.ticker) === ticker);
                const averageCost = Number(matchingHolding?.averageCost ?? 0);
                const unitCost = averageCost > 0 ? averageCost : (typeof livePrice === 'number' ? livePrice : 0);

                if (unitCost > 0) {
                    capitalTotal += quantity * unitCost;
                }
            });

            capitalTotal += initialCashContribution + explicitNetDeposits + syntheticFundingTotal;
            valorActual += this.sumBalanceMap(this.buildCurrentCashMap(portfolio.cashAccounts ?? [])) + syntheticFundingTotal;
        });

        return {
            totalReturn: capitalTotal > 0
                ? this.roundMetric(((valorActual - capitalTotal) / capitalTotal) * 100, 2)
                : null,
            winRate: evaluatedPositions > 0
                ? this.roundMetric((winningPositions / evaluatedPositions) * 100, 1)
                : null,
            riskScore: this.calculateRiskScore(allHoldings),
        };
    }

    private getProfileSelect() {
        return {
            id: true,
            username: true,
            email: true,
            bio: true,
            bioLong: true,
            avatarUrl: true,
            bannerUrl: true,
            isInfluencer: true,
            isVerified: true,
            plan: true,
            accountType: true,
            subscriptionStatus: true,
            title: true,
            company: true,
            location: true,
            website: true,
            linkedinUrl: true,
            twitterUrl: true,
            youtubeUrl: true,
            instagramUrl: true,
            yearsExperience: true,
            specializations: true,
            certifications: true,
            totalReturn: true,
            winRate: true,
            riskScore: true,
            isProfilePublic: true,
            showPortfolio: true,
            showStats: true,
            acceptingFollowers: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    following: true,
                    followedBy: true,
                },
            },
        };
    }

    async getCurrentUserProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.getProfileSelect(),
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Always compute live stats for own profile
        const liveStats = await this.calculatePortfolioStats(userId);
        return {
            ...user,
            totalReturn: liveStats.totalReturn,
            winRate: liveStats.winRate,
            riskScore: liveStats.riskScore,
        };
    }

    async getNotifications(userId: string, days?: number) {
        return this.notificationsService.getNotifications(userId, { days });
    }

    async getUnreadNotificationsCount(userId: string) {
        return this.notificationsService.countUnread(userId);
    }

    async markAllNotificationsAsRead(userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    async getUserProfile(username: string, viewerId?: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: this.getProfileSelect(),
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Si el perfil es privado, limitar la información mostrada
        const isFollowedByMe = viewerId
            ? await this.prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: viewerId,
                        followingId: user.id,
                    },
                },
                select: { followerId: true },
            }).then(Boolean)
            : false;

        if (!user.isProfilePublic) {
            return {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                isInfluencer: user.isInfluencer,
                isVerified: user.isVerified,
                accountType: user.accountType,
                plan: user.plan,
                isProfilePublic: false,
                isFollowedByMe,
            };
        }

        // Compute live portfolio stats if the user has showStats enabled
        if (user.showStats) {
            const liveStats = await this.calculatePortfolioStats(user.id);
            return {
                ...user,
                isFollowedByMe,
                totalReturn: liveStats.totalReturn,
                winRate: liveStats.winRate,
                riskScore: liveStats.riskScore,
            };
        }

        return {
            ...user,
            isFollowedByMe,
            totalReturn: null,
            winRate: null,
            riskScore: null,
        };
    }

    private normalizeNullableText(value: unknown, maxLen: number) {
        if (value === null) return null;
        if (typeof value !== 'string') return undefined;
        const normalized = value.trim();
        if (normalized.length === 0) return null;
        if (normalized.length > maxLen) {
            throw new BadRequestException(`El texto no puede superar ${maxLen} caracteres`);
        }
        return normalized;
    }

    async updateProfile(userId: string, updateData: any) {
        const filteredData: any = {};

        if (updateData.username !== undefined) {
            if (typeof updateData.username !== 'string') {
                throw new BadRequestException('El username es inválido');
            }
            const username = updateData.username.trim();
            if (username.length < 3 || username.length > 20) {
                throw new BadRequestException('El username debe tener entre 3 y 20 caracteres');
            }
            filteredData.username = username;
        }

        if (updateData.email !== undefined) {
            if (typeof updateData.email !== 'string') {
                throw new BadRequestException('El email es inválido');
            }
            const email = updateData.email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new BadRequestException('El email es inválido');
            }
            filteredData.email = email;
        }

        const stringFieldConfig: Record<string, number> = {
            bio: 300,
            bioLong: 2000,
            avatarUrl: 500,
            bannerUrl: 500,
            title: 120,
            company: 120,
            location: 120,
            website: 500,
            linkedinUrl: 500,
            twitterUrl: 500,
            youtubeUrl: 500,
            instagramUrl: 500,
            specializations: 2000,
            certifications: 2000,
        };

        for (const [field, maxLen] of Object.entries(stringFieldConfig)) {
            if (updateData[field] !== undefined) {
                const normalized = this.normalizeNullableText(updateData[field], maxLen);
                if (normalized !== undefined) {
                    filteredData[field] = normalized;
                }
            }
        }

        if (updateData.yearsExperience !== undefined) {
            if (updateData.yearsExperience === null || updateData.yearsExperience === '') {
                filteredData.yearsExperience = null;
            } else {
                const years = Number(updateData.yearsExperience);
                if (!Number.isFinite(years) || years < 0 || years > 80) {
                    throw new BadRequestException('Los años de experiencia son inválidos');
                }
                filteredData.yearsExperience = Math.round(years);
            }
        }

        const booleanFields = ['isProfilePublic', 'showPortfolio', 'showStats', 'acceptingFollowers'];
        for (const field of booleanFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = Boolean(updateData[field]);
            }
        }

        if (Object.keys(filteredData).length === 0) {
            return this.getCurrentUserProfile(userId);
        }

        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: filteredData,
                select: this.getProfileSelect(),
            });
            return updated;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException('El username o email ya está en uso');
            }
            throw error;
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        if (!currentPassword || !newPassword) {
            throw new BadRequestException('Debes completar la contraseña actual y la nueva');
        }

        if (newPassword.length < 8) {
            throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
        }

        if (newPassword === currentPassword) {
            throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isValidPassword = await argon2.verify(user.password, currentPassword);
        if (!isValidPassword) {
            throw new UnauthorizedException('La contraseña actual es incorrecta');
        }

        const hashedPassword = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true, message: 'Contraseña actualizada correctamente' };
    }

    async getUserStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        posts: true,
                        following: true,
                        followedBy: true,
                        portfolios: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Calcular estadísticas adicionales si tiene portfolios
        const portfolioStats = await this.calculatePortfolioStats(userId);

        return {
            postsCount: user._count.posts,
            followersCount: user._count.followedBy,
            followingCount: user._count.following,
            portfoliosCount: user._count.portfolios,
            ...portfolioStats,
        };
    }

    private async calculatePortfolioStats(userId: string) {
        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            select: {
                holdings: {
                    select: {
                        quantity: true,
                        averageCost: true,
                        asset: {
                            select: {
                                ticker: true,
                            },
                        },
                    },
                },
                transactions: {
                    select: {
                        id: true,
                        type: true,
                        date: true,
                        createdAt: true,
                        quantity: true,
                        total: true,
                        fee: true,
                        currency: true,
                        pricePerUnit: true,
                        asset: {
                            select: {
                                ticker: true,
                            },
                        },
                    },
                },
                cashAccounts: {
                    select: {
                        currency: true,
                        balance: true,
                    },
                },
            },
        });

        if (portfolios.length === 0) {
            return {
                totalReturn: null,
                winRate: null,
                riskScore: null,
            };
        }

        const holdings = portfolios.flatMap((portfolio) => portfolio.holdings);
        const quoteMap = await this.buildQuotePriceMap(holdings);
        return this.computePortfolioStatsFromPortfolios(portfolios, quoteMap);
    }

    async getTopTraders() {
        const traders = await this.prisma.user.findMany({
            where: {
                isProfilePublic: true,
                showStats: true,
                portfolios: {
                    some: {
                        holdings: {
                            some: {},
                        },
                    },
                },
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                isVerified: true,
                title: true,
                company: true,
                portfolios: {
                    select: {
                        holdings: {
                            select: {
                                quantity: true,
                                averageCost: true,
                                asset: {
                                    select: {
                                        ticker: true,
                                    },
                                },
                            },
                        },
                        transactions: {
                            select: {
                                id: true,
                                type: true,
                                date: true,
                                createdAt: true,
                                quantity: true,
                                total: true,
                                fee: true,
                                currency: true,
                                pricePerUnit: true,
                                asset: {
                                    select: {
                                        ticker: true,
                                    },
                                },
                            },
                        },
                        cashAccounts: {
                            select: {
                                currency: true,
                                balance: true,
                            },
                        },
                    },
                },
            },
        });

        const traderHoldings = traders.flatMap((trader) => trader.portfolios.flatMap((portfolio) => portfolio.holdings));
        const quoteMap = await this.buildQuotePriceMap(traderHoldings);

        return traders
            .map((trader) => {
                const stats = this.computePortfolioStatsFromPortfolios(trader.portfolios, quoteMap);
                return {
                    id: trader.id,
                    username: trader.username,
                    avatarUrl: trader.avatarUrl,
                    totalReturn: stats.totalReturn,
                    winRate: stats.winRate,
                    riskScore: stats.riskScore,
                    isVerified: trader.isVerified,
                    title: trader.title,
                    company: trader.company,
                };
            })
            .filter((trader) => trader.totalReturn !== null)
            .sort((left, right) => (right.totalReturn ?? Number.NEGATIVE_INFINITY) - (left.totalReturn ?? Number.NEGATIVE_INFINITY))
            .slice(0, 10);
    }

    async searchUsers(query: string) {
        if (!query || query.length < 2) return [];
        return this.prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                    mode: 'insensitive',
                },
                isProfilePublic: true,
            },
            take: 10,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                isVerified: true,
                title: true,
                company: true,
                bio: true,
                winRate: true,
                totalReturn: true,
            },
        });
    }

    async toggleFollow(followerId: string, username: string) {
        const [targetUser, follower] = await Promise.all([
            this.prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    acceptingFollowers: true,
                    _count: {
                        select: {
                            followedBy: true,
                        },
                    },
                },
            }),
            this.prisma.user.findUnique({
                where: { id: followerId },
                select: {
                    id: true,
                    username: true,
                },
            }),
        ]);

        if (!targetUser) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!follower) {
            throw new NotFoundException('Usuario autenticado no encontrado');
        }

        if (targetUser.id === followerId) {
            throw new BadRequestException('No puedes seguir tu propio perfil');
        }

        const existing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: targetUser.id,
                },
            },
            select: { followerId: true },
        });

        if (existing) {
            await this.prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId: targetUser.id,
                    },
                },
            });

            return {
                following: false,
                followersCount: Math.max((targetUser._count?.followedBy || 1) - 1, 0),
            };
        }

        if (!targetUser.acceptingFollowers) {
            throw new BadRequestException('Este usuario no acepta seguidores en este momento');
        }

        await this.prisma.follow.create({
            data: {
                followerId,
                followingId: targetUser.id,
            },
        });

        await this.notificationsService.createNotification({
            userId: targetUser.id,
            actorId: followerId,
            type: 'follow',
            title: `${follower.username} empezo a seguirte.`,
            link: `/profile/${follower.username}`,
        });

        return {
            following: true,
            followersCount: (targetUser._count?.followedBy || 0) + 1,
        };
    }
}
