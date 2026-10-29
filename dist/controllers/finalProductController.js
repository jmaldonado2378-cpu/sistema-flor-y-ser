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
            const { rawMaterialId, code, barcode, name, unitWeightGrams, unit, netContentLabel, currentStock, minStock, costPrice, price, ingredients, dietaryBadgeCodes, defaultExpirationDays, familyId, isBlend, isResale, supplierName, ingredientsList } = req.body;
            const resolvedWeight = unitWeightGrams !== undefined && unitWeightGrams !== '' ? parseFloat(unitWeightGrams) : 1;
            const resolvedUnit = (unit || 'GRS').toString().toUpperCase();
            if (!code || !name || currentStock === undefined) {
                res.status(400).json({ status: 'ERROR', message: 'Los campos code, name y currentStock son obligatorios.' });
                return;
            }
            const unitSuffixMap = {
                GRS: 'grs', GR: 'grs', G: 'grs',
                KG: 'kg',
                ML: 'ml',
                CM3: 'cm3',
                LTS: 'lts', L: 'lts',
                UND: 'und', UN: 'und'
            };
            const suffix = unitSuffixMap[resolvedUnit] || resolvedUnit.toLowerCase();
            const created = await this.finalProductService.create({
                rawMaterialId: isResale ? undefined : rawMaterialId,
                code,
                barcode,
                name,
                unitWeightGrams: resolvedWeight,
                unit: resolvedUnit,
                netContentLabel: netContentLabel || `${resolvedWeight} ${suffix}`,
                currentStock: parseInt(currentStock, 10),
                minStock: minStock ? parseInt(minStock, 10) : 10,
                costPrice: costPrice ? parseFloat(costPrice) : 0,
                price: price ? parseFloat(price) : 0,
                ingredients,
                dietaryBadgeCodes,
                defaultExpirationDays: defaultExpirationDays ? parseInt(defaultExpirationDays, 10) : 180,
                familyId,
                isBlend: isResale ? false : Boolean(isBlend),
                isResale: Boolean(isResale),
                supplierName: supplierName || undefined,
                ingredientsList: isResale ? [] : (Array.isArray(ingredientsList) ? ingredientsList : [])
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
    bulkImport = async (req, res) => {
        try {
            const { items } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ status: 'ERROR', message: 'Se requiere una lista "items" no vacía.' });
                return;
            }
            const result = await this.finalProductService.bulkImport(items);
            res.json({ status: 'SUCCESS', count: result.importedCount, data: result.items });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    purgeAll = async (req, res) => {
        try {
            const count = await this.finalProductService.purgeAll();
            res.json({ status: 'SUCCESS', message: `Se eliminaron ${count} productos finales.` });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.finalProductService.delete(id);
            if (!result.success) {
                res.status(400).json({ status: 'ERROR', message: result.message || 'No se pudo eliminar el producto final.' });
                return;
            }
            res.json({ status: 'SUCCESS', message: 'Producto final eliminado exitosamente.' });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    toggleStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const updated = await this.finalProductService.toggleStatus(id, isActive !== undefined ? Boolean(isActive) : undefined);
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
