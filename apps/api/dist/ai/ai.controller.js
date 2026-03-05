"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const ai_web_service_1 = require("./services/ai-web.service");
const fundamental_analysis_dto_1 = require("./dto/fundamental-analysis.dto");
const web_analysis_dto_1 = require("./dto/web-analysis.dto");
const VALIDATION_PIPE = new common_1.ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
});
let AiController = class AiController {
    constructor(aiService, aiWebService) {
        this.aiService = aiService;
        this.aiWebService = aiWebService;
    }
    async generateFundamentalAnalysis(body) {
        return this.aiService.generateFundamentalAnalysis(body);
    }
    async analyzeWebQuery(body) {
        return this.aiWebService.analyzeWebQuery(body);
    }
    async analyzeAssetWithWebContext(body) {
        return this.aiWebService.analyzeAssetWithWebContext(body);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('fundamental-analysis'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(VALIDATION_PIPE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fundamental_analysis_dto_1.FundamentalAnalysisDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateFundamentalAnalysis", null);
__decorate([
    (0, common_1.Post)('web-analysis'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(VALIDATION_PIPE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [web_analysis_dto_1.WebAnalysisDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeWebQuery", null);
__decorate([
    (0, common_1.Post)('asset-web-context'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UsePipes)(VALIDATION_PIPE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [web_analysis_dto_1.AssetWebAnalysisDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeAssetWithWebContext", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        ai_web_service_1.AiWebService])
], AiController);
//# sourceMappingURL=ai.controller.js.map