"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementService = void 0;
const uuid_1 = require("uuid");
class StockMovementService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Registra un movimiento en la tabla stock_movements (Kardex).
     * Puede recibir un client de transacción opcional.
     */
    async recordMovement(data, client) {
        const id = (0, uuid_1.v4)();
        const executor = client || this.db;
        const query = `
      INSERT INTO stock_movements (
        id, item_type, item_id, item_name, movement_type, quantity,
        previous_stock, resulting_stock, unit_of_measure, unit_cost,
        reference_type, reference_id, reference_number, reason, user_name, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      RETURNING id, created_at;
    `;
        try {
            const res = await executor.query(query, [
                id,
                data.itemType,
                data.itemId,
                data.itemName,
                data.movementType,
                data.quantity,
                data.previousStock,
                data.resultingStock,
                data.unitOfMeasure || 'UN',
                data.unitCost ?? null,
                data.referenceType ?? null,
                data.referenceId ?? null,
                data.referenceNumber ?? null,
                data.reason ?? null,
                data.userName ?? 'Sistema',
                data.notes ?? null
            ]);
            const createdAt = res.rows?.[0]?.created_at?.toISOString?.() || new Date().toISOString();
            return {
                ...data,
                id,
                createdAt
            };
        }
        catch (err) {
            console.warn('⚠️ Error al registrar movimiento en stock_movements:', err.message);
            return {
                ...data,
                id,
                createdAt: new Date().toISOString()
            };
        }
    }
    /**
     * Realiza un ajuste de stock manual (merma, rotura, conteo físico, etc.)
     * actualizando la tabla correspondiente y registrando la auditoría en el Kardex.
     */
    async adjustStock(dto, userName = 'Administrador') {
        if (!dto.itemId || !dto.itemType || !dto.adjustmentType || dto.quantity === undefined) {
            throw new Error('Tipo de artículo, ID, tipo de ajuste y cantidad son requeridos.');
        }
        let client = null;
        try {
            client = await this.db.connect();
            await client.query('BEGIN');
            let currentStock = 0;
            let itemName = '';
            let unitOfMeasure = 'KG';
            let unitCost = 0;
            // 1. Obtener artículo según tipo
            if (dto.itemType === 'RAW_MATERIAL') {
                const res = await client.query('SELECT id, name, unit, current_stock, cost_per_unit FROM raw_materials WHERE id = $1 FOR UPDATE', [dto.itemId]);
                if (res.rows.length === 0)
                    throw new Error(`Materia prima no encontrada (ID: ${dto.itemId})`);
                const row = res.rows[0];
                currentStock = parseFloat(row.current_stock || '0');
                itemName = row.name;
                unitOfMeasure = row.unit || 'KG';
                unitCost = parseFloat(row.cost_per_unit || '0');
            }
            else if (dto.itemType === 'FINAL_PRODUCT') {
                const res = await client.query('SELECT id, name, current_stock, cost_price FROM final_products WHERE id = $1 FOR UPDATE', [dto.itemId]);
                if (res.rows.length === 0)
                    throw new Error(`Producto final no encontrado (ID: ${dto.itemId})`);
                const row = res.rows[0];
                currentStock = parseFloat(row.current_stock || '0');
                itemName = row.name;
                unitOfMeasure = 'UN';
                unitCost = parseFloat(row.cost_price || '0');
            }
            else if (dto.itemType === 'PACKAGING') {
                const res = await client.query('SELECT id, name, unit, current_stock, cost_per_unit FROM packaging_materials WHERE id = $1 FOR UPDATE', [dto.itemId]);
                if (res.rows.length === 0)
                    throw new Error(`Material de empaque no encontrado (ID: ${dto.itemId})`);
                const row = res.rows[0];
                currentStock = parseFloat(row.current_stock || '0');
                itemName = row.name;
                unitOfMeasure = row.unit || 'UN';
                unitCost = parseFloat(row.cost_per_unit || '0');
            }
            // 2. Calcular nuevo stock y cantidad neta del movimiento
            const qty = Math.abs(dto.quantity);
            let resultingStock = currentStock;
            let netMovementQty = 0;
            if (dto.adjustmentType === 'ADD') {
                resultingStock = currentStock + qty;
                netMovementQty = qty;
            }
            else if (dto.adjustmentType === 'SUBTRACT') {
                resultingStock = Math.max(0, currentStock - qty);
                netMovementQty = -(currentStock - resultingStock);
            }
            else if (dto.adjustmentType === 'SET_EXACT') {
                resultingStock = Math.max(0, qty);
                netMovementQty = resultingStock - currentStock;
            }
            // 3. Actualizar la tabla correspondiente
            if (dto.itemType === 'RAW_MATERIAL') {
                await client.query('UPDATE raw_materials SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [resultingStock, dto.itemId]);
            }
            else if (dto.itemType === 'FINAL_PRODUCT') {
                await client.query('UPDATE final_products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [resultingStock, dto.itemId]);
                try {
                    await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [resultingStock, dto.itemId]);
                }
                catch { }
            }
            else if (dto.itemType === 'PACKAGING') {
                await client.query('UPDATE packaging_materials SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [resultingStock, dto.itemId]);
            }
            // 4. Registrar en el Kardex (stock_movements)
            const movement = await this.recordMovement({
                itemType: dto.itemType,
                itemId: dto.itemId,
                itemName,
                movementType: 'MANUAL_ADJUSTMENT',
                quantity: netMovementQty,
                previousStock: currentStock,
                resultingStock,
                unitOfMeasure,
                unitCost,
                referenceType: 'ADJUSTMENT',
                reason: dto.reason,
                userName,
                notes: dto.notes
            }, client);
            await client.query('COMMIT');
            return {
                movement,
                previousStock: currentStock,
                resultingStock
            };
        }
        catch (err) {
            if (client) {
                try {
                    await client.query('ROLLBACK');
                }
                catch { }
            }
            throw err;
        }
        finally {
            if (client)
                client.release();
        }
    }
    /**
     * Consulta el historial de movimientos de stock (Kardex) con filtros avanzados.
     */
    async getMovements(filters = {}) {
        const where = [];
        const params = [];
        let idx = 1;
        if (filters.itemId) {
            where.push(`item_id = $${idx++}`);
            params.push(filters.itemId);
        }
        if (filters.itemType) {
            where.push(`item_type = $${idx++}`);
            params.push(filters.itemType);
        }
        if (filters.movementType) {
            where.push(`movement_type = $${idx++}`);
            params.push(filters.movementType);
        }
        if (filters.startDate) {
            where.push(`created_at >= $${idx++}`);
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            where.push(`created_at <= $${idx++}`);
            params.push(`${filters.endDate} 23:59:59`);
        }
        if (filters.search) {
            where.push(`(item_name LIKE $${idx} OR reference_number LIKE $${idx} OR reason LIKE $${idx} OR user_name LIKE $${idx})`);
            params.push(`%${filters.search}%`);
            idx++;
        }
        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const limit = Math.min(Math.max(filters.limit || 100, 1), 1000);
        const offset = Math.max(filters.offset || 0, 0);
        try {
            const countRes = await this.db.query(`SELECT COUNT(*) as total FROM stock_movements ${whereClause}`, params);
            const total = parseInt(countRes.rows?.[0]?.total || '0', 10);
            const query = `
        SELECT * FROM stock_movements
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
            const res = await this.db.query(query, params);
            const movements = res.rows.map((row) => ({
                id: row.id,
                itemType: row.item_type,
                itemId: row.item_id,
                itemName: row.item_name,
                movementType: row.movement_type,
                quantity: parseFloat(row.quantity),
                previousStock: parseFloat(row.previous_stock || '0'),
                resultingStock: parseFloat(row.resulting_stock || '0'),
                unitOfMeasure: row.unit_of_measure,
                unitCost: row.unit_cost ? parseFloat(row.unit_cost) : undefined,
                referenceType: row.reference_type,
                referenceId: row.reference_id,
                referenceNumber: row.reference_number,
                reason: row.reason,
                userName: row.user_name,
                notes: row.notes,
                createdAt: row.created_at?.toISOString?.() || row.created_at
            }));
            return { movements, total };
        }
        catch (err) {
            console.warn('⚠️ Error al consultar movimientos de stock:', err.message);
            return { movements: [], total: 0 };
        }
    }
}
exports.StockMovementService = StockMovementService;
