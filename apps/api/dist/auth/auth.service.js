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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_1 = require("@nestjs/jwt");
const argon2 = require("argon2");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });
        if (exists) {
            throw new common_1.BadRequestException('User already exists');
        }
        const hashedPassword = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: hashedPassword,
            },
        });
        return this.signToken(user);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await argon2.verify(user.password, dto.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.signToken(user);
    }
    async signToken(user) {
        const payload = { sub: user.id, username: user.username, role: user.role };
        const token = await this.jwtService.signAsync(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                isInfluencer: user.isInfluencer,
                bio: user.bio ?? null,
                avatarUrl: user.avatarUrl ?? null,
                createdAt: user.createdAt,
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map