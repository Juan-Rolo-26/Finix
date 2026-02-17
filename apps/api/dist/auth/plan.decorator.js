"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePlan = exports.PLANS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PLANS_KEY = 'plans';
const RequirePlan = (...plans) => (0, common_1.SetMetadata)(exports.PLANS_KEY, plans);
exports.RequirePlan = RequirePlan;
//# sourceMappingURL=plan.decorator.js.map