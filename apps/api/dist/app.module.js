"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mail_module_1 = require("./mail/mail.module");
const auth_module_1 = require("./auth/auth.module");
const prisma_service_1 = require("./prisma.service");
const market_module_1 = require("./market/market.module");
const portfolio_module_1 = require("./portfolio/portfolio.module");
const posts_module_1 = require("./posts/posts.module");
const news_module_1 = require("./news/news.module");
const user_module_1 = require("./user/user.module");
const analysis_module_1 = require("./analysis/analysis.module");
const communities_module_1 = require("./communities/communities.module");
const stripe_module_1 = require("./stripe/stripe.module");
const billing_module_1 = require("./billing/billing.module");
const access_module_1 = require("./access/access.module");
const creator_application_module_1 = require("./creator-application/creator-application.module");
const settings_module_1 = require("./settings/settings.module");
const fundamental_module_1 = require("./fundamental/fundamental.module");
const ai_module_1 = require("./ai/ai.module");
const messages_module_1 = require("./messages/messages.module");
const events_gateway_1 = require("./events.gateway");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            market_module_1.MarketModule,
            portfolio_module_1.PortfolioModule,
            posts_module_1.PostsModule,
            news_module_1.NewsModule,
            user_module_1.UserModule,
            analysis_module_1.AnalysisModule,
            communities_module_1.CommunitiesModule,
            stripe_module_1.StripeModule,
            billing_module_1.BillingModule,
            access_module_1.AccessModule,
            creator_application_module_1.CreatorApplicationModule,
            settings_module_1.SettingsModule,
            fundamental_module_1.FundamentalModule,
            ai_module_1.AiModule,
            messages_module_1.MessagesModule,
            admin_module_1.AdminModule,
            mail_module_1.MailModule,
        ],
        controllers: [],
        providers: [prisma_service_1.PrismaService, events_gateway_1.EventsGateway],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map