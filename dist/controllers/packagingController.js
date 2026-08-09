"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagingController = void 0;
class PackagingController {
    packagingService;
    constructor(packagingService) {
        this.packagingService = packagingService;
    }
    getAll = async (req, res) => {
        try {
            const data = await this.packagingService.getAll();
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    create = async (req, res) => {
        try {
            const data = await this.packagingService.create(req.body);
            res.status(201).json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
    updateStock = async (req, res) => {
        try {
            const { id } = req.params;
            const { newStock } = req.body;
            const data = await this.packagingService.updateStock(id, newStock);
            if (!data) {
                res.status(404).json({ status: 'ERROR', message: 'Material de empaque no encontrado' });
                return;
            }
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const data = await this.packagingService.update(id, req.body);
            if (!data) {
                res.status(404).json({ status: 'ERROR', message: 'Material de empaque no encontrado' });
                return;
            }
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.PackagingController = PackagingController;
