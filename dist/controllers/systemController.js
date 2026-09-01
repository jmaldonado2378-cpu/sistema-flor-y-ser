"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
class SystemController {
    systemService;
    constructor(systemService) {
        this.systemService = systemService;
    }
    getDbStatus = async (req, res) => {
        try {
            const status = await this.systemService.getDbStatus();
            res.json({ status: 'SUCCESS', data: status });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    purgeSeedData = async (req, res) => {
        try {
            const result = await this.systemService.purgeSeedData();
            res.json({ status: 'SUCCESS', data: result });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.SystemController = SystemController;
