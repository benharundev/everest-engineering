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
exports.GetAuditLogsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("./pagination.dto");
const inventory_audit_log_entity_1 = require("../../domain/entities/inventory-audit-log.entity");
class GetAuditLogsQueryDto extends pagination_dto_1.PaginationDto {
}
exports.GetAuditLogsQueryDto = GetAuditLogsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: inventory_audit_log_entity_1.InventoryAuditAction, description: 'Filter by audit action' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(inventory_audit_log_entity_1.InventoryAuditAction),
    __metadata("design:type", String)
], GetAuditLogsQueryDto.prototype, "action", void 0);
//# sourceMappingURL=get-audit-logs-query.dto.js.map