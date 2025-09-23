"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthEndpoint = void 0;
const healthEndpoint = (req, res) => {
    res.json({
        success: true,
        message: 'Drosera Authenticator Backend is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
    });
};
exports.healthEndpoint = healthEndpoint;
//# sourceMappingURL=health.js.map