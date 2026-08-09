"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalProductController = void 0;
class FinalProductController {
    finalProductService;
    constructor(finalProductService) {
        this.finalProductService = finalProductService;
    }
    getAll = async (req, res) => {
        try {
            const products = await this.finalProductService.getAll();
            res.json({ status: 'SUCCESS', count: products.length, data: products });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    create = async (req, res) => {
        try {
            const { rawMaterialId, code, barcode, name, unitWeightGrams, netContentLabel, currentStock, minStock, price, ingredients, dietaryBadgeCodes, defaultExpirationDays, familyId, isBlend, ingredientsList } = req.body;
            if (!code || !name || unitWeightGrams === undefined || currentStock === undefined) {
                res.status(400).json({ status: 'ERROR', message: 'Los campos code, name, unitWeightGrams y currentStock son obligatorios.' });
                return;
            }
            const created = await this.finalProductService.create({
                rawMaterialId,
                code,
                barcode,
                name,
                unitWeightGrams: parseFloat(unitWeightGrams),
                netContentLabel: netContentLabel || `${unitWeightGrams}g`,
                currentStock: parseInt(currentStock, 10),
                minStock: minStock ? parseInt(minStock, 10) : 10,
                price: price ? parseFloat(price) : 0,
                ingredients,
                dietaryBadgeCodes,
                defaultExpirationDays: defaultExpirationDays ? parseInt(defaultExpirationDays, 10) : 180,
                familyId,
                isBlend: Boolean(isBlend),
                ingredientsList: Array.isArray(ingredientsList) ? ingredientsList : []
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
            const updated = await this.finalProductService.updateStock(id, parseInt(newStock, 10));
            if (!updated) {
                res.status(404).json({ status: 'ERROR', message: 'Producto final no encontrado.' });
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
            const updated = await this.finalProductService.update(id, req.body);
            if (!updated) {
                res.status(404).json({ status: 'ERROR', message: 'Producto final no encontrado.' });
                return;
            }
            res.json({ status: 'SUCCESS', data: updated });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.FinalProductController = FinalProductController;
