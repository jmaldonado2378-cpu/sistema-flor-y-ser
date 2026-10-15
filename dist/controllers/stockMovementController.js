"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementController = void 0;
class StockMovementController {
    stockMovementService;
    constructor(stockMovementService) {
        this.stockMovementService = stockMovementService;
    }
    getMovements = async (req, res) => {
        try {
            const { itemId, itemType, movementType, startDate, endDate, search, limit, offset } = req.query;
            const result = await this.stockMovementService.getMovements({
                itemId: itemId,
                itemType: itemType,
                movementType: movementType,
                startDate: startDate,
                endDate: endDate,
                search: search,
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined
            });
            res.json({
                status: 'SUCCESS',
                data: result.movements,
                total: result.total
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error al consultar movimientos de stock' });
        }
    };
    adjustStock = async (req, res) => {
        try {
            const { itemType, itemId, adjustmentType, quantity, reason, notes } = req.body;
            if (!itemType || !itemId || !adjustmentType || quantity === undefined) {
                res.status(400).json({
                    error: 'itemType, itemId, adjustmentType y quantity son campos requeridos.'
                });
                return;
            }
            const userName = req.user?.name || 'Administrador';
            const result = await this.stockMovementService.adjustStock({
                itemType,
                itemId,
                adjustmentType,
                quantity: parseFloat(quantity),
                reason: reason || 'Ajuste manual de inventario',
                notes
            }, userName);
            res.status(200).json({
                status: 'SUCCESS',
                message: 'Ajuste de stock registrado exitosamente.',
                data: result
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message || 'Error al procesar el ajuste de stock' });
        }
    };
}
exports.StockMovementController = StockMovementController;
