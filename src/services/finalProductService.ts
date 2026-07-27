import { Pool } from 'pg';
import { FinalProduct, CreateFinalProductDTO } from '../types/inventory';

// Mock initial packaged products for fallback
const initialFinalProducts: FinalProduct[] = [
  {
    id: 'fp-001',
    rawMaterialId: 'rm-001',
    rawMaterialName: 'Almendras Peladas Importadas Granel',
    code: 'PF-ALM-250',
    barcode: '7791234567891',
    name: 'Almendras Peladas Selección 250g',
    unitWeightGrams: 250,
    netContentLabel: '250g',
    currentStock: 48,
    minStock: 15,
    price: 3400.00,
    ingredients: '100% Almendras peladas sin sal agregada',
    dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
    defaultExpirationDays: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fp-002',
    rawMaterialId: 'rm-001',
    rawMaterialName: 'Almendras Peladas Importadas Granel',
    code: 'PF-ALM-500',
    barcode: '7791234567892',
    name: 'Almendras Peladas Selección 500g',
    unitWeightGrams: 500,
    netContentLabel: '500g',
    currentStock: 22,
    minStock: 10,
    price: 6500.00,
    ingredients: '100% Almendras peladas sin sal agregada',
    dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
    defaultExpirationDays: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fp-003',
    rawMaterialId: 'rm-002',
    rawMaterialName: 'Granola Miel & Coco Base Granel',
    code: 'PF-GRA-500',
    barcode: '7791234567893',
    name: 'Granola Artesanal Coco & Almendras 500g',
    unitWeightGrams: 500,
    netContentLabel: '500g',
    currentStock: 35,
    minStock: 12,
    price: 2800.00,
    ingredients: 'Avena arrollada, miel orgánica, escamas de coco, almendras, semillas de girasol',
    dietaryBadgeCodes: ['ORGANIC'],
    defaultExpirationDays: 120,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fp-004',
    rawMaterialId: 'rm-003',
    rawMaterialName: 'Harina de Almendras Fina Granel (Sin TACC)',
    code: 'PF-HAR-250',
    barcode: '7791234567894',
    name: 'Harina de Almendras Ultra Fina 250g',
    unitWeightGrams: 250,
    netContentLabel: '250g',
    currentStock: 4, // Alerta stock bajo
    minStock: 10,
    price: 3900.00,
    ingredients: '100% Almendras molidas libres de gluten',
    dietaryBadgeCodes: ['VEGAN', 'CELIAC', 'KETO'],
    defaultExpirationDays: 150,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class FinalProductService {
  private inMemoryProducts: FinalProduct[] = [...initialFinalProducts];

  constructor(private db: Pool) {}

  async getAll(): Promise<FinalProduct[]> {
    try {
      const res = await this.db.query(`
        SELECT fp.id, fp.raw_material_id AS "rawMaterialId", rm.name AS "rawMaterialName",
               fp.code, fp.barcode, fp.name, fp.unit_weight_grams AS "unitWeightGrams",
               fp.net_content_label AS "netContentLabel", fp.current_stock AS "currentStock",
               fp.min_stock AS "minStock", fp.price, fp.ingredients,
               fp.dietary_badge_codes AS "dietaryBadgeCodes",
               fp.default_expiration_days AS "defaultExpirationDays",
               fp.is_active AS "isActive", fp.created_at AS "createdAt", fp.updated_at AS "updatedAt"
        FROM final_products fp
        LEFT JOIN raw_materials rm ON fp.raw_material_id = rm.id
        WHERE fp.is_active = TRUE
        ORDER BY fp.name ASC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          ...row,
          unitWeightGrams: parseFloat(row.unitWeightGrams),
          price: parseFloat(row.price),
          dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]')
        }));
      }
    } catch {
      // Fallback
    }
    return this.inMemoryProducts.filter(p => p.isActive);
  }

  async getById(id: string): Promise<FinalProduct | null> {
    try {
      const res = await this.db.query(`
        SELECT fp.id, fp.raw_material_id AS "rawMaterialId", rm.name AS "rawMaterialName",
               fp.code, fp.barcode, fp.name, fp.unit_weight_grams AS "unitWeightGrams",
               fp.net_content_label AS "netContentLabel", fp.current_stock AS "currentStock",
               fp.min_stock AS "minStock", fp.price, fp.ingredients,
               fp.dietary_badge_codes AS "dietaryBadgeCodes",
               fp.default_expiration_days AS "defaultExpirationDays",
               fp.is_active AS "isActive", fp.created_at AS "createdAt", fp.updated_at AS "updatedAt"
        FROM final_products fp
        LEFT JOIN raw_materials rm ON fp.raw_material_id = rm.id
        WHERE fp.id = $1;
      `, [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          ...row,
          unitWeightGrams: parseFloat(row.unitWeightGrams),
          price: parseFloat(row.price),
          dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]')
        };
      }
    } catch {
      // Fallback
    }
    return this.inMemoryProducts.find(p => p.id === id) || null;
  }

  async create(dto: CreateFinalProductDTO): Promise<FinalProduct> {
    const generatedBarcode = dto.barcode || '779' + Math.floor(1000000000 + Math.random() * 9000000000);
    try {
      const res = await this.db.query(`
        INSERT INTO final_products (raw_material_id, code, barcode, name, unit_weight_grams, net_content_label, current_stock, min_stock, price, ingredients, dietary_badge_codes, default_expiration_days)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
        RETURNING id, raw_material_id AS "rawMaterialId", code, barcode, name, unit_weight_grams AS "unitWeightGrams",
                  net_content_label AS "netContentLabel", current_stock AS "currentStock",
                  min_stock AS "minStock", price, ingredients, dietary_badge_codes AS "dietaryBadgeCodes",
                  default_expiration_days AS "defaultExpirationDays", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
        dto.rawMaterialId || null,
        dto.code,
        generatedBarcode,
        dto.name,
        dto.unitWeightGrams,
        dto.netContentLabel,
        dto.currentStock,
        dto.minStock ?? 10,
        dto.price ?? 0,
        dto.ingredients || null,
        JSON.stringify(dto.dietaryBadgeCodes || []),
        dto.defaultExpirationDays ?? 180
      ]);
      const row = res.rows[0];
      return {
        ...row,
        unitWeightGrams: parseFloat(row.unitWeightGrams),
        price: parseFloat(row.price),
        dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]')
      };
    } catch {
      // Fallback in-memory
      const newProduct: FinalProduct = {
        id: 'fp-' + Date.now(),
        rawMaterialId: dto.rawMaterialId,
        code: dto.code,
        barcode: generatedBarcode,
        name: dto.name,
        unitWeightGrams: dto.unitWeightGrams,
        netContentLabel: dto.netContentLabel,
        currentStock: dto.currentStock,
        minStock: dto.minStock ?? 10,
        price: dto.price,
        ingredients: dto.ingredients,
        dietaryBadgeCodes: dto.dietaryBadgeCodes || [],
        defaultExpirationDays: dto.defaultExpirationDays ?? 180,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.inMemoryProducts.push(newProduct);
      return newProduct;
    }
  }

  async updateStock(id: string, newStock: number): Promise<FinalProduct | null> {
    try {
      const res = await this.db.query(`
        UPDATE final_products
        SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, raw_material_id AS "rawMaterialId", code, barcode, name, unit_weight_grams AS "unitWeightGrams",
                  net_content_label AS "netContentLabel", current_stock AS "currentStock",
                  min_stock AS "minStock", price, ingredients, dietary_badge_codes AS "dietaryBadgeCodes",
                  default_expiration_days AS "defaultExpirationDays", is_active AS "isActive",
                  created_at AS "createdAt", updated_at AS "updatedAt";
      `, [newStock, id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          ...row,
          unitWeightGrams: parseFloat(row.unitWeightGrams),
          price: parseFloat(row.price),
          dietaryBadgeCodes: Array.isArray(row.dietaryBadgeCodes) ? row.dietaryBadgeCodes : JSON.parse(row.dietaryBadgeCodes || '[]')
        };
      }
    } catch {
      // Fallback
    }

    const prod = this.inMemoryProducts.find(p => p.id === id);
    if (prod) {
      prod.currentStock = newStock;
      prod.updatedAt = new Date().toISOString();
      return prod;
    }
    return null;
  }
}
