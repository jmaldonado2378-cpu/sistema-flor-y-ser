import { Pool } from 'pg';
import { RawMaterialService } from './rawMaterialService';
import { FinalProductService } from './finalProductService';
import { TaskService } from './taskService';
import { 
  FractioningPreviewRequestDTO, 
  FractioningPreviewResponseDTO, 
  ExecuteFractioningDTO, 
  FractioningOrder 
} from '../types/fractioning';

const initialFractioningOrders: FractioningOrder[] = [
  {
    id: 'fo-001',
    orderNumber: 'FRAC-20260720-01',
    rawMaterialId: 'rm-001',
    rawMaterialName: 'Almendras Peladas Importadas Granel',
    finalProductId: 'fp-001',
    finalProductName: 'Almendras Peladas Selección 250g',
    inputQtyKg: 10.000,
    targetUnits: 40,
    actualOutputUnits: 39,
    wasteKg: 0.250,
    wastePercentage: 2.50,
    wasteReason: 'Merma normal de descarte por rotura y polvo de empaque',
    rawMaterialBatch: 'L-ALM-2026-06',
    generatedBatch: 'LOT-20260720-A',
    fractioningDate: '2026-07-20T14:30:00.000Z',
    expirationDate: '2027-01-16',
    operatorName: 'María Clara (Empaque)',
    notes: 'Proceso completado sin inconvenientes. Excelente calidad del lote.',
    createdAt: '2026-07-20T14:30:00.000Z'
  },
  {
    id: 'fo-002',
    orderNumber: 'FRAC-20260718-02',
    rawMaterialId: 'rm-002',
    rawMaterialName: 'Granola Miel & Coco Base Granel',
    finalProductId: 'fp-003',
    finalProductName: 'Granola Artesanal Coco & Almendras 500g',
    inputQtyKg: 20.000,
    targetUnits: 40,
    actualOutputUnits: 39,
    wasteKg: 0.500,
    wastePercentage: 2.50,
    wasteReason: 'Restos en tolva de envasado',
    rawMaterialBatch: 'L-GRA-2026-05',
    generatedBatch: 'LOT-20260718-B',
    fractioningDate: '2026-07-18T10:15:00.000Z',
    expirationDate: '2026-11-15',
    operatorName: 'Lucía Fernández',
    notes: 'Empacado en bolsas selladas al vacío.',
    createdAt: '2026-07-18T10:15:00.000Z'
  }
];

export class FractioningService {
  private inMemoryOrders: FractioningOrder[] = [...initialFractioningOrders];

  constructor(
    private db: Pool,
    private rawMaterialService: RawMaterialService,
    private finalProductService: FinalProductService,
    private taskService?: TaskService
  ) {}

  async calculatePreview(dto: FractioningPreviewRequestDTO): Promise<FractioningPreviewResponseDTO> {
    const rawMaterial = await this.rawMaterialService.getById(dto.rawMaterialId);
    if (!rawMaterial) {
      throw new Error(`Materia prima con ID "${dto.rawMaterialId}" no encontrada.`);
    }

    const finalProduct = await this.finalProductService.getById(dto.finalProductId);
    if (!finalProduct) {
      throw new Error(`Producto final con ID "${dto.finalProductId}" no encontrado.`);
    }

    const unitWeightGrams = finalProduct.unitWeightGrams || 250;
    const inputQtyKg = dto.inputQtyKg || 0;

    const targetUnits = Math.floor((inputQtyKg * 1000) / unitWeightGrams);
    const actualOutputUnits = dto.actualOutputUnits !== undefined ? dto.actualOutputUnits : targetUnits;

    const expectedOutputKg = (actualOutputUnits * unitWeightGrams) / 1000;
    const wasteKg = Math.max(0, parseFloat((inputQtyKg - expectedOutputKg).toFixed(3)));
    const wastePercentage = inputQtyKg > 0 ? parseFloat(((wasteKg / inputQtyKg) * 100).toFixed(2)) : 0;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const suggestedBatch = `LOT-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (finalProduct.defaultExpirationDays || 180));
    const suggestedExpirationDate = expDate.toISOString().split('T')[0];

    const hasSufficientStock = rawMaterial.currentStock >= inputQtyKg;

    return {
      rawMaterialId: rawMaterial.id,
      rawMaterialName: rawMaterial.name,
      rawMaterialStockKg: rawMaterial.currentStock,
      finalProductId: finalProduct.id,
      finalProductName: finalProduct.name,
      unitWeightGrams,
      inputQtyKg,
      targetUnits,
      expectedOutputKg,
      actualOutputUnits,
      wasteKg,
      wastePercentage,
      suggestedBatch,
      suggestedExpirationDate,
      hasSufficientStock
    };
  }

  /**
   * Finaliza la integración de stock de una orden de fraccionamiento al completarse la tarea en el Kanban.
   */
  async finalizeStockIntegration(dto: ExecuteFractioningDTO): Promise<{ order: FractioningOrder; rawMaterialNewStock: number; finalProductNewStock: number }> {
    const rawMaterial = await this.rawMaterialService.getById(dto.rawMaterialId);
    if (!rawMaterial) throw new Error('Materia prima no encontrada.');

    const finalProduct = await this.finalProductService.getById(dto.finalProductId);
    if (!finalProduct) throw new Error('Producto final no encontrado.');

    const unitWeightGrams = finalProduct.unitWeightGrams || 250;
    const targetUnits = Math.floor((dto.inputQtyKg * 1000) / unitWeightGrams);
    const actualOutputUnits = dto.actualOutputUnits;
    const expectedOutputKg = (actualOutputUnits * unitWeightGrams) / 1000;
    const wasteKg = Math.max(0, parseFloat((dto.inputQtyKg - expectedOutputKg).toFixed(3)));
    const wastePercentage = dto.inputQtyKg > 0 ? parseFloat(((wasteKg / dto.inputQtyKg) * 100).toFixed(2)) : 0;

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const orderNumber = `FRAC-${dateStr}-${Math.floor(10 + Math.random() * 90)}`;
    const generatedBatch = dto.generatedBatch || `LOT-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const rawNewStock = parseFloat((rawMaterial.currentStock - dto.inputQtyKg).toFixed(3));
    const finalNewStock = finalProduct.currentStock + actualOutputUnits;

    if (this.db) {
      try {
        const client = await this.db.connect();
        try {
          await client.query('BEGIN');

          await client.query(`UPDATE raw_materials SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [rawNewStock, rawMaterial.id]);
          await client.query(`UPDATE final_products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [finalNewStock, finalProduct.id]);

          const orderRes = await client.query(`
            INSERT INTO fractioning_orders (
              order_number, raw_material_id, final_product_id, input_qty_kg, target_units, actual_output_units,
              waste_kg, waste_percentage, waste_reason, raw_material_batch, generated_batch,
              expiration_date, operator_name, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, order_number AS "orderNumber", fractioning_date AS "fractioningDate", created_at AS "createdAt";
          `, [
            orderNumber,
            rawMaterial.id,
            finalProduct.id,
            dto.inputQtyKg,
            targetUnits,
            actualOutputUnits,
            wasteKg,
            wastePercentage,
            dto.wasteReason || 'Merma normal de fraccionado',
            dto.rawMaterialBatch,
            generatedBatch,
            dto.expirationDate,
            dto.operatorName,
            dto.notes || null
          ]);

          await client.query('COMMIT');

          const createdOrder: FractioningOrder = {
            id: orderRes.rows[0].id,
            orderNumber,
            rawMaterialId: rawMaterial.id,
            rawMaterialName: rawMaterial.name,
            finalProductId: finalProduct.id,
            finalProductName: finalProduct.name,
            inputQtyKg: dto.inputQtyKg,
            targetUnits,
            actualOutputUnits,
            wasteKg,
            wastePercentage,
            wasteReason: dto.wasteReason || 'Merma normal de fraccionado',
            rawMaterialBatch: dto.rawMaterialBatch,
            generatedBatch,
            fractioningDate: orderRes.rows[0].fractioningDate ? new Date(orderRes.rows[0].fractioningDate).toISOString() : new Date().toISOString(),
            expirationDate: dto.expirationDate,
            operatorName: dto.operatorName,
            notes: dto.notes,
            createdAt: new Date().toISOString()
          };

          return { order: createdOrder, rawMaterialNewStock: rawNewStock, finalProductNewStock: finalNewStock };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch {
        // Fallback
      }
    }

    // Fallback en memoria
    await this.rawMaterialService.updateStock(rawMaterial.id, rawNewStock);
    await this.finalProductService.updateStock(finalProduct.id, finalNewStock);

    const createdOrder: FractioningOrder = {
      id: 'fo-' + Date.now(),
      orderNumber,
      rawMaterialId: rawMaterial.id,
      rawMaterialName: rawMaterial.name,
      finalProductId: finalProduct.id,
      finalProductName: finalProduct.name,
      inputQtyKg: dto.inputQtyKg,
      targetUnits,
      actualOutputUnits,
      wasteKg,
      wastePercentage,
      wasteReason: dto.wasteReason || 'Merma normal de empaque',
      rawMaterialBatch: dto.rawMaterialBatch,
      generatedBatch,
      fractioningDate: new Date().toISOString(),
      expirationDate: dto.expirationDate,
      operatorName: dto.operatorName,
      notes: dto.notes,
      createdAt: new Date().toISOString()
    };

    this.inMemoryOrders.unshift(createdOrder);
    return { order: createdOrder, rawMaterialNewStock: rawNewStock, finalProductNewStock: finalNewStock };
  }

  async executeFractioning(dto: ExecuteFractioningDTO): Promise<{ order: FractioningOrder; rawMaterialNewStock: number; finalProductNewStock: number }> {
    const rawMaterial = await this.rawMaterialService.getById(dto.rawMaterialId);
    if (!rawMaterial) throw new Error('Materia prima no encontrada.');

    const finalProduct = await this.finalProductService.getById(dto.finalProductId);
    if (!finalProduct) throw new Error('Producto final no encontrado.');

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const generatedBatch = dto.generatedBatch || `LOT-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const fractioningPayload = {
      rawMaterialId: dto.rawMaterialId,
      finalProductId: dto.finalProductId,
      inputQtyKg: dto.inputQtyKg,
      actualOutputUnits: dto.actualOutputUnits,
      wasteReason: dto.wasteReason || 'Merma normal de fraccionado',
      rawMaterialBatch: dto.rawMaterialBatch,
      generatedBatch,
      expirationDate: dto.expirationDate,
      operatorName: dto.operatorName,
      notes: dto.notes
    };

    // Registrar tarea pendiente en el Kanban Tareas Operativas sin actualizar stock todavía
    if (this.taskService) {
      try {
        await this.taskService.createTask({
          title: `Fraccionado ${finalProduct.name}`,
          description: `Envasado de ${dto.inputQtyKg}kg de ${rawMaterial.name} en ${dto.actualOutputUnits} un. (${finalProduct.name}). Lote: ${generatedBatch}`,
          type: 'FRACTIONING',
          status: 'PENDING_FRACTIONING',
          priority: 'HIGH',
          assignedTo: dto.operatorName || 'María Clara (Empaque)',
          productId: finalProduct.id,
          productName: finalProduct.name,
          quantity: dto.actualOutputUnits,
          unitOfMeasure: 'unidades',
          notes: JSON.stringify(fractioningPayload)
        });
      } catch {}
    }

    const orderSimulada: FractioningOrder = {
      id: 'fo-pending-' + Date.now(),
      orderNumber: `FRAC-${dateStr}-PENDING`,
      rawMaterialId: rawMaterial.id,
      rawMaterialName: rawMaterial.name,
      finalProductId: finalProduct.id,
      finalProductName: finalProduct.name,
      inputQtyKg: dto.inputQtyKg,
      targetUnits: dto.actualOutputUnits,
      actualOutputUnits: dto.actualOutputUnits,
      wasteKg: 0,
      wastePercentage: 0,
      wasteReason: dto.wasteReason || 'Merma normal de fraccionado',
      rawMaterialBatch: dto.rawMaterialBatch,
      generatedBatch,
      fractioningDate: new Date().toISOString(),
      expirationDate: dto.expirationDate,
      operatorName: dto.operatorName,
      notes: dto.notes,
      createdAt: new Date().toISOString()
    };

    return { 
      order: orderSimulada, 
      rawMaterialNewStock: rawMaterial.currentStock, 
      finalProductNewStock: finalProduct.currentStock 
    };
  }

  async getHistory(): Promise<FractioningOrder[]> {
    try {
      const res = await this.db.query(`
        SELECT fo.id, fo.order_number AS "orderNumber", fo.raw_material_id AS "rawMaterialId", rm.name AS "rawMaterialName",
               fo.final_product_id AS "finalProductId", fp.name AS "finalProductName",
               fo.input_qty_kg AS "inputQtyKg", fo.target_units AS "targetUnits",
               fo.actual_output_units AS "actualOutputUnits", fo.waste_kg AS "wasteKg",
               fo.waste_percentage AS "wastePercentage", fo.waste_reason AS "wasteReason",
               fo.raw_material_batch AS "rawMaterialBatch", fo.generated_batch AS "generatedBatch",
               fo.fractioning_date AS "fractioningDate", fo.expiration_date AS "expirationDate",
               fo.operator_name AS "operatorName", fo.notes, fo.created_at AS "createdAt"
        FROM fractioning_orders fo
        LEFT JOIN raw_materials rm ON fo.raw_material_id = rm.id
        LEFT JOIN final_products fp ON fo.final_product_id = fp.id
        ORDER BY fo.fractioning_date DESC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          ...row,
          inputQtyKg: parseFloat(row.inputQtyKg),
          wasteKg: parseFloat(row.wasteKg),
          wastePercentage: parseFloat(row.wastePercentage),
          fractioningDate: row.fractioningDate ? new Date(row.fractioningDate).toISOString() : new Date().toISOString()
        }));
      }
    } catch {
      // Fallback
    }
    return this.inMemoryOrders;
  }
}
