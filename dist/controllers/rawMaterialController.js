"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawMaterialController = void 0;
class RawMaterialController {
    rawMaterialService;
    constructor(rawMaterialService) {
        this.rawMaterialService = rawMaterialService;
    }
    getAll = async (req, res) => {
        try {
            const materials = await this.rawMaterialService.getAll();
            res.json({ status: 'SUCCESS', count: materials.length, data: materials });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    create = async (req, res) => {
        try {
            const { code, name, unit, currentStock, minStock, costPerUnit, supplierName, storageLocation } = req.body;
            if (!code || !name || currentStock === undefined) {
                res.status(400).json({ status: 'ERROR', message: 'Los campos code, name y currentStock son obligatorios.' });
                return;
            }
            const created = await this.rawMaterialService.create({
                code,
                name,
                unit: unit || 'KG',
                currentStock: parseFloat(currentStock),
                minStock: minStock ? parseFloat(minStock) : 5.0,
                costPerUnit: costPerUnit ? parseFloat(costPerUnit) : 0,
                supplierName,
                storageLocation
            });
            res.status(201).json({ status: 'SUCCESS', data: created });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    updateStock = async (req, res) => {
        try {
            const { id } = req.params;
            const { newStock } = req.body;
            if (newStock === undefined) {
                res.status(400).json({ status: 'ERROR', message: 'El campo newStock es obligatorio.' });
                return;
            }
            const updated = await this.rawMaterialService.updateStock(id, parseFloat(newStock));
            if (!updated) {
                res.status(404).json({ status: 'ERROR', message: 'Materia prima no encontrada.' });
                return;
            }
            res.json({ status: 'SUCCESS', data: updated });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await this.rawMaterialService.update(id, req.body);
            if (!updated) {
                res.status(404).json({ status: 'ERROR', message: 'Materia prima no encontrada.' });
                return;
            }
            res.json({ status: 'SUCCESS', data: updated });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    bulkImport = async (req, res) => {
        try {
            const { items } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ status: 'ERROR', message: 'Se requiere una lista "items" no vacía.' });
                return;
            }
            const result = await this.rawMaterialService.bulkImport(items);
            res.json({ status: 'SUCCESS', count: result.importedCount, data: result.items });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    purgeAll = async (req, res) => {
        try {
            const count = await this.rawMaterialService.purgeAll();
            res.json({ status: 'SUCCESS', message: `Se eliminaron ${count} materias primas.` });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.RawMaterialController = RawMaterialController;
