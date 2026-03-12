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
exports.ForgotPasswordResetDto = exports.ForgotPasswordRequestDto = exports.EmailCodeDto = exports.LoginRequestDto = exports.RegisterRequestDto = exports.EmailRequestDto = void 0;
const class_validator_1 = require("class-validator");
class EmailRequestDto {
}
exports.EmailRequestDto = EmailRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], EmailRequestDto.prototype, "email", void 0);
class RegisterRequestDto {
}
exports.RegisterRequestDto = RegisterRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_]+$/, {
        message: 'El nombre de usuario solo puede contener letras, numeros y guiones bajos',
    }),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "password", void 0);
class LoginRequestDto {
}
exports.LoginRequestDto = LoginRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "password", void 0);
class EmailCodeDto extends EmailRequestDto {
}
exports.EmailCodeDto = EmailCodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, {
        message: 'El codigo debe tener 6 digitos',
    }),
    __metadata("design:type", String)
], EmailCodeDto.prototype, "code", void 0);
class ForgotPasswordRequestDto extends EmailRequestDto {
}
exports.ForgotPasswordRequestDto = ForgotPasswordRequestDto;
class ForgotPasswordResetDto extends EmailCodeDto {
}
exports.ForgotPasswordResetDto = ForgotPasswordResetDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ForgotPasswordResetDto.prototype, "newPassword", void 0);
//# sourceMappingURL=auth.dto.js.map