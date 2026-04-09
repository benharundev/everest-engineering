"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStateException = void 0;
const common_1 = require("@nestjs/common");
class InvalidStateException extends common_1.BadRequestException {
    constructor(currentStatus, attemptedAction) {
        super(`Cannot perform '${attemptedAction}' on a reservation in '${currentStatus}' status`);
    }
}
exports.InvalidStateException = InvalidStateException;
//# sourceMappingURL=invalid-state.exception.js.map