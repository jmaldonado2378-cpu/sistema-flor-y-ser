"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const uuid_1 = require("uuid");
/**
 * Servicio de Finanzas, Gastos Operativos y Estructura de Precios & Costos por Canal
 * Flor y Ser - Almacén Natural ERP/CRM v2.0
 */
class FinanceService {
    db;
    // Datos iniciales de simulación en memoria (para funcionamiento offline o testing)
    inMemoryExpenses = [
        {
            id: 'e1000000-0000-0000-0000-000000000001',
            description: 'Alquiler del Local Comercial (Julio 2026)',
            category: 'ALQUILER',
            voucherType: 'FACTURA_B',
            voucherNumber: 'F-0001-00004512',
            expenseDate: '2026-07-01',
            amount: 450000,
            paymentMethod: 'TRANSFERENCIA',
            supplierName: 'Inmobiliaria Central',
            notes: 'Pago del alquiler mensual de la sucursal principal.',
            createdAt: '2026-07-01T10:00:00Z',
            updatedAt: '2026-07-01T10:00:00Z'
        },
        {
            id: 'e2000000-0000-0000-0000-000000000002',
            description: 'Servicio de Luz Eléctrica Edesur',
            category: 'SERVICIOS',
            voucherType: 'FACTURA_B',
            voucherNumber: 'ED-8849201',
            expenseDate: '2026-07-05',
            amount: 85000,
            paymentMethod: 'MERCADO_PAGO',
            supplierName: 'Edesur S.A.',
            notes: 'Incluye consumo de heladeras y balanzas.',
            createdAt: '2026-07-05T12:30:00Z',
            updatedAt: '2026-07-05T12:30:00Z'
        },
        {
            id: 'e3000000-0000-0000-0000-000000000003',
            description: 'Sueldos Personal de Mostrador y Armado',
            category: 'SUELDOS',
            voucherType: 'RECIBO',
            voucherNumber: 'REC-2026-07',
            expenseDate: '2026-07-10',
            amount: 680000,
            paymentMethod: 'TRANSFERENCIA',
            notes: 'Pago de haberes del personal operativo.',
            createdAt: '2026-07-10T16:00:00Z',
            updatedAt: '2026-07-10T16:00:00Z'
        },
        {
            id: 'e4000000-0000-0000-0000-000000000004',
            description: 'Compra de Bolsas Biodegradables y Bobinas de Etiquetas Thermal',
            category: 'LOGISTICA',
            voucherType: 'FACTURA_A',
            voucherNumber: 'A-0005-00012399',
            expenseDate: '2026-07-15',
            amount: 42000,
            paymentMethod: 'TRANSFERENCIA',
            supplierName: 'EcoEmpaques SRL',
            notes: 'Insumos de empaque para fraccionado y mostrador.',
            createdAt: '2026-07-15T09:15:00Z',
            updatedAt: '2026-07-15T09:15:00Z'
        },
        {
            id: 'e5000000-0000-0000-0000-000000000005',
            description: 'Publicidad en Instagram y Facebook Ads',
            category: 'MARKETING',
            voucherType: 'FACTURA_C',
            voucherNumber: 'FB-9938210',
            expenseDate: '2026-07-18',
            amount: 55000,
            paymentMethod: 'TARJETA_CREDITO',
            supplierName: 'Meta Platforms Inc.',
            notes: 'Campaña de fidelización y promociones de productos orgánicos.',
            createdAt: '2026-07-18T14:20:00Z',
            updatedAt: '2026-07-18T14:20:00Z'
        }
    ];
    inMemoryPricingStructures = [
        {
            id: 'ps100000-0000-0000-0000-000000000001',
            productId: 'p1000000-0000-0000-0000-000000000001',
            productSku: 'AVG-1KG',
            productName: 'Avena Arrollada Orgánica 1kg',
            unitOfMeasure: 'kg',
            rawMaterialCost: 1200,
            packagingLabelCost: 150,
            laborCost: 200,
            totalDirectCost: 1550,
            allocatedFixedCosts: 350,
            taxPercentage: 21,
            totalUnitCost: 1900,
            channels: {
                mostrador: {
                    channelKey: 'mostrador',
                    channelName: 'Mostrador',
                    commissionPercentage: 0,
                    marginPercentage: 40,
                    suggestedPrice: 3367,
                    finalPrice: 3400,
                    profitAmount: 786,
                    realMarginPercentage: 23.12
                },
                whatsapp: {
                    channelKey: 'whatsapp',
                    channelName: 'WhatsApp',
                    commissionPercentage: 2,
                    marginPercentage: 35,
                    suggestedPrice: 3342,
                    finalPrice: 3350,
                    profitAmount: 579.5,
                    realMarginPercentage: 17.30
                },
                tiendaOnline: {
                    channelKey: 'tiendaOnline',
                    channelName: 'Tienda Online',
                    commissionPercentage: 5,
                    marginPercentage: 30,
                    suggestedPrice: 3343,
                    finalPrice: 3350,
                    profitAmount: 479,
                    realMarginPercentage: 14.30
                }
            },
            updatedAt: '2026-07-20T11:00:00Z'
        },
        {
            id: 'ps200000-0000-0000-0000-000000000002',
            productId: 'p2000000-0000-0000-0000-000000000002',
            productSku: 'ALM-PEL-500G',
            productName: 'Almendras Peladas Nonpareil 500g',
            unitOfMeasure: 'unidades',
            rawMaterialCost: 4500,
            packagingLabelCost: 250,
            laborCost: 300,
            totalDirectCost: 5050,
            allocatedFixedCosts: 450,
            taxPercentage: 21,
            totalUnitCost: 5500,
            channels: {
                mostrador: {
                    channelKey: 'mostrador',
                    channelName: 'Mostrador',
                    commissionPercentage: 0,
                    marginPercentage: 45,
                    suggestedPrice: 10095,
                    finalPrice: 10100,
                    profitAmount: 2479,
                    realMarginPercentage: 24.54
                },
                whatsapp: {
                    channelKey: 'whatsapp',
                    channelName: 'WhatsApp',
                    commissionPercentage: 2,
                    marginPercentage: 40,
                    suggestedPrice: 9961,
                    finalPrice: 9950,
                    profitAmount: 2160.5,
                    realMarginPercentage: 21.71
                },
                tiendaOnline: {
                    channelKey: 'tiendaOnline',
                    channelName: 'Tienda Online',
                    commissionPercentage: 5,
                    marginPercentage: 35,
                    suggestedPrice: 9905,
                    finalPrice: 9900,
                    profitAmount: 1826,
                    realMarginPercentage: 18.44
                }
            },
            updatedAt: '2026-07-21T15:30:00Z'
        }
    ];
    constructor(db) {
        this.db = db;
        this.ensureTablesExist();
    }
    /**
     * Crea automáticamente las tablas necesarias si la base de datos PostgreSQL está conectada.
     */
    async ensureTablesExist() {
        if (!this.db)
            return;
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS operational_expenses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          description VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          voucher_type VARCHAR(50),
          voucher_number VARCHAR(100),
          expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
          amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
          payment_method VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
          supplier_id UUID,
          supplier_name VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_pricing_structures (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          product_id UUID NOT NULL UNIQUE,
          product_sku VARCHAR(50),
          product_name VARCHAR(255) NOT NULL,
          unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'unidades',
          raw_material_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
          packaging_label_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
          labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
          allocated_fixed_costs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
          tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
          mostrador_commission_pct NUMERIC(5,2) DEFAULT 0.00,
          mostrador_margin_pct NUMERIC(5,2) DEFAULT 35.00,
          mostrador_suggested_price NUMERIC(12,2) DEFAULT 0.00,
          mostrador_final_price NUMERIC(12,2) DEFAULT 0.00,
          whatsapp_commission_pct NUMERIC(5,2) DEFAULT 2.00,
          whatsapp_margin_pct NUMERIC(5,2) DEFAULT 30.00,
          whatsapp_suggested_price NUMERIC(12,2) DEFAULT 0.00,
          whatsapp_final_price NUMERIC(12,2) DEFAULT 0.00,
          online_commission_pct NUMERIC(5,2) DEFAULT 5.00,
          online_margin_pct NUMERIC(5,2) DEFAULT 25.00,
          online_suggested_price NUMERIC(12,2) DEFAULT 0.00,
          online_final_price NUMERIC(12,2) DEFAULT 0.00,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
        }
        catch (error) {
            console.warn('⚠️ Error creando tablas del Módulo de Finanzas (usando soporte fallback en memoria):', error.message);
        }
    }
    // =========================================================================
    // GESTIÓN DE GASTOS OPERATIVOS (EXPENSES)
    // =========================================================================
    /**
     * Registra un nuevo Gasto Operativo
     */
    async createExpense(dto) {
        if (!dto.description || !dto.description.trim()) {
            throw new Error('La descripción del gasto es obligatoria.');
        }
        if (dto.amount === undefined || dto.amount <= 0) {
            throw new Error('El monto del gasto debe ser mayor a cero.');
        }
        if (!dto.category) {
            throw new Error('La categoría del gasto es obligatoria.');
        }
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const expenseDate = dto.expenseDate ? dto.expenseDate.split('T')[0] : now.split('T')[0];
        const newExpense = {
            id,
            description: dto.description.trim(),
            category: dto.category,
            voucherType: dto.voucherType || 'SIN_COMPROBANTE',
            voucherNumber: dto.voucherNumber?.trim(),
            expenseDate,
            amount: Number(dto.amount),
            paymentMethod: dto.paymentMethod || 'EFECTIVO',
            supplierId: dto.supplierId,
            supplierName: dto.supplierName?.trim(),
            notes: dto.notes?.trim(),
            createdAt: now,
            updatedAt: now
        };
        if (this.db) {
            try {
                const query = `
          INSERT INTO operational_expenses (
            id, description, category, voucher_type, voucher_number,
            expense_date, amount, payment_method, supplier_id, supplier_name, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
                const values = [
                    newExpense.id,
                    newExpense.description,
                    newExpense.category,
                    newExpense.voucherType,
                    newExpense.voucherNumber || null,
                    newExpense.expenseDate,
                    newExpense.amount,
                    newExpense.paymentMethod,
                    newExpense.supplierId || null,
                    newExpense.supplierName || null,
                    newExpense.notes || null
                ];
                const res = await this.db.query(query, values);
                if (res.rows[0]) {
                    return this.mapDbExpense(res.rows[0]);
                }
            }
            catch (err) {
                console.warn('⚠️ Guardando gasto en memoria fallback por error DB:', err.message);
            }
        }
        this.inMemoryExpenses.unshift(newExpense);
        return newExpense;
    }
    /**
     * Obtiene el listado de Gastos Operativos aplicando filtros opcionales
     */
    async getExpenses(filter) {
        if (this.db) {
            try {
                let query = `SELECT * FROM operational_expenses WHERE 1=1`;
                const values = [];
                if (filter?.category) {
                    values.push(filter.category);
                    query += ` AND category = $${values.length}`;
                }
                if (filter?.startDate) {
                    values.push(filter.startDate);
                    query += ` AND expense_date >= $${values.length}`;
                }
                if (filter?.endDate) {
                    values.push(filter.endDate);
                    query += ` AND expense_date <= $${values.length}`;
                }
                if (filter?.minAmount !== undefined) {
                    values.push(filter.minAmount);
                    query += ` AND amount >= $${values.length}`;
                }
                if (filter?.maxAmount !== undefined) {
                    values.push(filter.maxAmount);
                    query += ` AND amount <= $${values.length}`;
                }
                if (filter?.searchQuery) {
                    values.push(`%${filter.searchQuery.trim()}%`);
                    query += ` AND (description ILIKE $${values.length} OR supplier_name ILIKE $${values.length} OR voucher_number ILIKE $${values.length})`;
                }
                query += ` ORDER BY expense_date DESC, created_at DESC;`;
                const res = await this.db.query(query, values);
                if (res.rows.length > 0) {
                    return res.rows.map(row => this.mapDbExpense(row));
                }
            }
            catch (err) {
                console.warn('⚠️ Consultando gastos en memoria fallback:', err.message);
            }
        }
        // Filtrado en memoria
        let result = [...this.inMemoryExpenses];
        if (filter?.category) {
            result = result.filter(e => e.category === filter.category);
        }
        if (filter?.startDate) {
            result = result.filter(e => e.expenseDate >= filter.startDate);
        }
        if (filter?.endDate) {
            result = result.filter(e => e.expenseDate <= filter.endDate);
        }
        if (filter?.minAmount !== undefined) {
            result = result.filter(e => e.amount >= filter.minAmount);
        }
        if (filter?.maxAmount !== undefined) {
            result = result.filter(e => e.amount <= filter.maxAmount);
        }
        if (filter?.searchQuery) {
            const q = filter.searchQuery.toLowerCase();
            result = result.filter(e => e.description.toLowerCase().includes(q) ||
                (e.supplierName && e.supplierName.toLowerCase().includes(q)) ||
                (e.voucherNumber && e.voucherNumber.toLowerCase().includes(q)));
        }
        return result.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
    }
    /**
     * Obtiene un Gasto Operativo por ID
     */
    async getExpenseById(id) {
        if (this.db) {
            try {
                const res = await this.db.query('SELECT * FROM operational_expenses WHERE id = $1', [id]);
                if (res.rows[0])
                    return this.mapDbExpense(res.rows[0]);
            }
            catch (err) {
                console.warn('⚠️ Buscando gasto en memoria fallback:', err.message);
            }
        }
        const item = this.inMemoryExpenses.find(e => e.id === id);
        return item || null;
    }
    /**
     * Actualiza un Gasto Operativo
     */
    async updateExpense(id, dto) {
        const existing = await this.getExpenseById(id);
        if (!existing) {
            throw new Error(`Gasto operativo con ID ${id} no encontrado.`);
        }
        const updated = {
            ...existing,
            description: dto.description !== undefined ? dto.description.trim() : existing.description,
            category: dto.category !== undefined ? dto.category : existing.category,
            voucherType: dto.voucherType !== undefined ? dto.voucherType : existing.voucherType,
            voucherNumber: dto.voucherNumber !== undefined ? dto.voucherNumber.trim() : existing.voucherNumber,
            expenseDate: dto.expenseDate !== undefined ? dto.expenseDate.split('T')[0] : existing.expenseDate,
            amount: dto.amount !== undefined ? Number(dto.amount) : existing.amount,
            paymentMethod: dto.paymentMethod !== undefined ? dto.paymentMethod : existing.paymentMethod,
            supplierId: dto.supplierId !== undefined ? dto.supplierId : existing.supplierId,
            supplierName: dto.supplierName !== undefined ? dto.supplierName.trim() : existing.supplierName,
            notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
            updatedAt: new Date().toISOString()
        };
        if (this.db) {
            try {
                const query = `
          UPDATE operational_expenses
          SET description = $1, category = $2, voucher_type = $3, voucher_number = $4,
              expense_date = $5, amount = $6, payment_method = $7, supplier_id = $8,
              supplier_name = $9, notes = $10, updated_at = NOW()
          WHERE id = $11
          RETURNING *;
        `;
                const values = [
                    updated.description,
                    updated.category,
                    updated.voucherType,
                    updated.voucherNumber || null,
                    updated.expenseDate,
                    updated.amount,
                    updated.paymentMethod,
                    updated.supplierId || null,
                    updated.supplierName || null,
                    updated.notes || null,
                    id
                ];
                const res = await this.db.query(query, values);
                if (res.rows[0])
                    return this.mapDbExpense(res.rows[0]);
            }
            catch (err) {
                console.warn('⚠️ Actualizando gasto en memoria fallback:', err.message);
            }
        }
        const idx = this.inMemoryExpenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.inMemoryExpenses[idx] = updated;
        }
        return updated;
    }
    /**
     * Elimina un Gasto Operativo
     */
    async deleteExpense(id) {
        if (this.db) {
            try {
                const res = await this.db.query('DELETE FROM operational_expenses WHERE id = $1', [id]);
                if (res.rowCount && res.rowCount > 0)
                    return true;
            }
            catch (err) {
                console.warn('⚠️ Eliminando gasto en memoria fallback:', err.message);
            }
        }
        const idx = this.inMemoryExpenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.inMemoryExpenses.splice(idx, 1);
            return true;
        }
        return false;
    }
    /**
     * Genera el Resumen Operativo Financiero y Desglose por Categorías de Gastos
     */
    async getExpenseSummary(startDate, endDate) {
        const expenses = await this.getExpenses({ startDate, endDate });
        const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const totalCount = expenses.length;
        // Agrupamiento por categoría
        const categoriesMap = {
            ALQUILER: { count: 0, totalAmount: 0 },
            SERVICIOS: { count: 0, totalAmount: 0 },
            SUELDOS: { count: 0, totalAmount: 0 },
            LOGISTICA: { count: 0, totalAmount: 0 },
            MARKETING: { count: 0, totalAmount: 0 },
            MANTENIMIENTO: { count: 0, totalAmount: 0 },
            IMPUESTOS: { count: 0, totalAmount: 0 },
            OTROS: { count: 0, totalAmount: 0 }
        };
        const categoryNames = {
            ALQUILER: 'Alquiler del Local / Depósito',
            SERVICIOS: 'Servicios (Luz, Agua, Gas, Internet)',
            SUELDOS: 'Sueldos y Cargas Sociales',
            LOGISTICA: 'Empaques y Logística',
            MARKETING: 'Publicidad y Marketing Digital',
            MANTENIMIENTO: 'Mantenimiento y Equipamiento',
            IMPUESTOS: 'Impuestos y Tasas Municipales',
            OTROS: 'Otros Gastos Operativos'
        };
        expenses.forEach(exp => {
            const cat = exp.category in categoriesMap ? exp.category : 'OTROS';
            categoriesMap[cat].count += 1;
            categoriesMap[cat].totalAmount += exp.amount;
        });
        const byCategory = Object.keys(categoriesMap).map(key => {
            const cat = key;
            const amount = categoriesMap[cat].totalAmount;
            return {
                category: cat,
                categoryName: categoryNames[cat],
                totalAmount: amount,
                count: categoriesMap[cat].count,
                percentageOfTotal: totalExpenseAmount > 0 ? Number(((amount / totalExpenseAmount) * 100).toFixed(2)) : 0
            };
        });
        // Promedio mensual estimado
        const monthlyAverage = totalExpenseAmount > 0 ? Number((totalExpenseAmount / 1).toFixed(2)) : 0;
        return {
            totalExpenseAmount,
            totalCount,
            monthlyAverage,
            byCategory: byCategory.sort((a, b) => b.totalAmount - a.totalAmount),
            periodStartDate: startDate,
            periodEndDate: endDate
        };
    }
    // =========================================================================
    // CÁLCULO FINANCIERO COMPLETO DE COSTOS Y MÁRGENES POR CANAL (PRICING)
    // =========================================================================
    /**
     * Lógica Central de Cálculo Financiero para Estructura de Precios por Producto.
     * Calcula costos directos, costos unitarios totales, precio sugerido, ganancia neta en $ y margen real por canal.
     */
    calculatePricingStructureItem(input) {
        const rawMaterialCost = Number(input.rawMaterialCost || 0);
        const packagingLabelCost = Number(input.packagingLabelCost || 0);
        const laborCost = Number(input.laborCost || 0);
        const allocatedFixedCosts = Number(input.allocatedFixedCosts || 0);
        const taxPercentage = Number(input.taxPercentage || 0);
        // Costo Directo por Unidad ($)
        const totalDirectCost = Number((rawMaterialCost + packagingLabelCost + laborCost).toFixed(2));
        // Costo Unitario Total Base ($)
        const totalUnitCost = Number((totalDirectCost + allocatedFixedCosts).toFixed(2));
        // Helper para procesar métricas de cada canal de venta
        const processChannel = (key, name, config) => {
            const commissionPercentage = Number(config.commissionPercentage || 0);
            const marginPercentage = Number(config.marginPercentage || 0);
            /**
             * FÓRMULA DE PRECIO SUGERIDO:
             * Costo Base = totalUnitCost
             * Margen deseado sobre costo = totalUnitCost * (1 + marginPercentage / 100)
             * El precio sugerido debe cubrir comisión por canal e impuestos extraídos del precio final.
             * Precio Sugerido = [totalUnitCost * (1 + marginPercentage / 100)] / [1 - ((taxPercentage + commissionPercentage) / 100)]
             */
            const targetMarginAmount = totalUnitCost * (1 + marginPercentage / 100);
            const deductionsRatio = (taxPercentage + commissionPercentage) / 100;
            let suggestedPrice = 0;
            if (deductionsRatio < 1) {
                suggestedPrice = targetMarginAmount / (1 - deductionsRatio);
            }
            else {
                suggestedPrice = targetMarginAmount * (1 + deductionsRatio);
            }
            suggestedPrice = Math.round(suggestedPrice); // Redondeo comercial en pesos enteros
            // Precio final de venta (si no se proporciona, se adopta el sugerido)
            const finalPrice = config.finalPrice !== undefined && config.finalPrice > 0
                ? Math.round(Number(config.finalPrice))
                : suggestedPrice;
            /**
             * CÁLCULO DE GANANCIA NETA EN PESOS ($):
             * Ganancia Neta = Precio Final - [Costo Unitario Total + (Precio Final * % Comisión) + (Precio Final * % Impuestos)]
             */
            const commissionDeduction = finalPrice * (commissionPercentage / 100);
            const taxDeduction = finalPrice * (taxPercentage / 100);
            const totalDeductions = commissionDeduction + taxDeduction;
            const profitAmount = Number((finalPrice - (totalUnitCost + totalDeductions)).toFixed(2));
            // Margen Neto Real % sobre Precio Final de Venta
            const realMarginPercentage = finalPrice > 0
                ? Number(((profitAmount / finalPrice) * 100).toFixed(2))
                : 0;
            return {
                channelKey: key,
                channelName: name,
                commissionPercentage,
                marginPercentage,
                suggestedPrice,
                finalPrice,
                profitAmount,
                realMarginPercentage
            };
        };
        const mostradorMetrics = processChannel('mostrador', 'Mostrador', input.channels.mostrador);
        const whatsappMetrics = processChannel('whatsapp', 'WhatsApp', input.channels.whatsapp);
        const tiendaOnlineMetrics = processChannel('tiendaOnline', 'Tienda Online', input.channels.tiendaOnline);
        return {
            productId: input.productId || (0, uuid_1.v4)(),
            productSku: input.productSku || 'SKU-TEMP',
            productName: input.productName || 'Producto General',
            unitOfMeasure: input.unitOfMeasure || 'unidades',
            rawMaterialCost,
            packagingLabelCost,
            laborCost,
            totalDirectCost,
            allocatedFixedCosts,
            taxPercentage,
            totalUnitCost,
            channels: {
                mostrador: mostradorMetrics,
                whatsapp: whatsappMetrics,
                tiendaOnline: tiendaOnlineMetrics
            },
            updatedAt: new Date().toISOString()
        };
    }
    /**
     * Guarda o actualiza la Estructura de Precios y Costos de un Producto
     */
    async savePricingStructure(input) {
        if (!input.productId) {
            throw new Error('El ID del producto (productId) es obligatorio para guardar la estructura de precios.');
        }
        const calculated = this.calculatePricingStructureItem(input);
        if (this.db) {
            try {
                const query = `
          INSERT INTO product_pricing_structures (
            product_id, product_sku, product_name, unit_of_measure,
            raw_material_cost, packaging_label_cost, labor_cost, allocated_fixed_costs, tax_percentage,
            mostrador_commission_pct, mostrador_margin_pct, mostrador_suggested_price, mostrador_final_price,
            whatsapp_commission_pct, whatsapp_margin_pct, whatsapp_suggested_price, whatsapp_final_price,
            online_commission_pct, online_margin_pct, online_suggested_price, online_final_price,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
          ON CONFLICT (product_id) DO UPDATE SET
            product_sku = EXCLUDED.product_sku,
            product_name = EXCLUDED.product_name,
            unit_of_measure = EXCLUDED.unit_of_measure,
            raw_material_cost = EXCLUDED.raw_material_cost,
            packaging_label_cost = EXCLUDED.packaging_label_cost,
            labor_cost = EXCLUDED.labor_cost,
            allocated_fixed_costs = EXCLUDED.allocated_fixed_costs,
            tax_percentage = EXCLUDED.tax_percentage,
            mostrador_commission_pct = EXCLUDED.mostrador_commission_pct,
            mostrador_margin_pct = EXCLUDED.mostrador_margin_pct,
            mostrador_suggested_price = EXCLUDED.mostrador_suggested_price,
            mostrador_final_price = EXCLUDED.mostrador_final_price,
            whatsapp_commission_pct = EXCLUDED.whatsapp_commission_pct,
            whatsapp_margin_pct = EXCLUDED.whatsapp_margin_pct,
            whatsapp_suggested_price = EXCLUDED.whatsapp_suggested_price,
            whatsapp_final_price = EXCLUDED.whatsapp_final_price,
            online_commission_pct = EXCLUDED.online_commission_pct,
            online_margin_pct = EXCLUDED.online_margin_pct,
            online_suggested_price = EXCLUDED.online_suggested_price,
            online_final_price = EXCLUDED.online_final_price,
            updated_at = NOW()
          RETURNING *;
        `;
                const values = [
                    calculated.productId,
                    calculated.productSku,
                    calculated.productName,
                    calculated.unitOfMeasure,
                    calculated.rawMaterialCost,
                    calculated.packagingLabelCost,
                    calculated.laborCost,
                    calculated.allocatedFixedCosts,
                    calculated.taxPercentage,
                    calculated.channels.mostrador.commissionPercentage,
                    calculated.channels.mostrador.marginPercentage,
                    calculated.channels.mostrador.suggestedPrice,
                    calculated.channels.mostrador.finalPrice,
                    calculated.channels.whatsapp.commissionPercentage,
                    calculated.channels.whatsapp.marginPercentage,
                    calculated.channels.whatsapp.suggestedPrice,
                    calculated.channels.whatsapp.finalPrice,
                    calculated.channels.tiendaOnline.commissionPercentage,
                    calculated.channels.tiendaOnline.marginPercentage,
                    calculated.channels.tiendaOnline.suggestedPrice,
                    calculated.channels.tiendaOnline.finalPrice
                ];
                const res = await this.db.query(query, values);
                if (res.rows[0])
                    return this.mapDbPricingStructure(res.rows[0]);
            }
            catch (err) {
                console.warn('⚠️ Guardando estructura de precios en memoria fallback:', err.message);
            }
        }
        const idx = this.inMemoryPricingStructures.findIndex(p => p.productId === calculated.productId);
        if (idx !== -1) {
            this.inMemoryPricingStructures[idx] = calculated;
        }
        else {
            this.inMemoryPricingStructures.push(calculated);
        }
        return calculated;
    }
    /**
     * Obtiene la estructura de precios para todos los productos
     */
    async getAllPricingStructures() {
        if (this.db) {
            try {
                const res = await this.db.query('SELECT * FROM product_pricing_structures ORDER BY product_name ASC;');
                if (res.rows.length > 0) {
                    return res.rows.map(row => this.mapDbPricingStructure(row));
                }
            }
            catch (err) {
                console.warn('⚠️ Consultando estructuras de precios en memoria fallback:', err.message);
            }
        }
        return [...this.inMemoryPricingStructures];
    }
    /**
     * Obtiene la estructura de precios de un producto específico
     */
    async getPricingStructureByProductId(productId) {
        if (this.db) {
            try {
                const res = await this.db.query('SELECT * FROM product_pricing_structures WHERE product_id = $1;', [productId]);
                if (res.rows[0])
                    return this.mapDbPricingStructure(res.rows[0]);
            }
            catch (err) {
                console.warn('⚠️ Buscando estructura de precios por ID en memoria fallback:', err.message);
            }
        }
        const item = this.inMemoryPricingStructures.find(p => p.productId === productId);
        return item || null;
    }
    /**
     * Prorratea los Gastos Fijos Operativos entre todos los productos activos.
     * Divide los gastos operativos mensuales entre el total de productos para calcular y actualizar 'allocatedFixedCosts'.
     */
    async allocateFixedCosts(dto) {
        const expenseSummary = await this.getExpenseSummary();
        const totalFixed = dto?.totalMonthlyFixedExpenses !== undefined
            ? Number(dto.totalMonthlyFixedExpenses)
            : expenseSummary.totalExpenseAmount;
        const products = await this.getAllPricingStructures();
        const productCount = dto?.totalActiveProductsCount || (products.length > 0 ? products.length : 1);
        const allocatedFixedCostPerUnit = Number((totalFixed / productCount).toFixed(2));
        // Recalcular y actualizar cada producto con el nuevo costo fijo prorrateado
        let updatedCount = 0;
        for (const prod of products) {
            const input = {
                productId: prod.productId,
                productSku: prod.productSku,
                productName: prod.productName,
                unitOfMeasure: prod.unitOfMeasure,
                rawMaterialCost: prod.rawMaterialCost,
                packagingLabelCost: prod.packagingLabelCost,
                laborCost: prod.laborCost,
                allocatedFixedCosts: allocatedFixedCostPerUnit,
                taxPercentage: prod.taxPercentage,
                channels: {
                    mostrador: {
                        commissionPercentage: prod.channels.mostrador.commissionPercentage,
                        marginPercentage: prod.channels.mostrador.marginPercentage,
                        finalPrice: prod.channels.mostrador.finalPrice
                    },
                    whatsapp: {
                        commissionPercentage: prod.channels.whatsapp.commissionPercentage,
                        marginPercentage: prod.channels.whatsapp.marginPercentage,
                        finalPrice: prod.channels.whatsapp.finalPrice
                    },
                    tiendaOnline: {
                        commissionPercentage: prod.channels.tiendaOnline.commissionPercentage,
                        marginPercentage: prod.channels.tiendaOnline.marginPercentage,
                        finalPrice: prod.channels.tiendaOnline.finalPrice
                    }
                }
            };
            await this.savePricingStructure(input);
            updatedCount++;
        }
        return {
            allocatedFixedCostPerUnit,
            totalProductsUpdated: updatedCount
        };
    }
    /**
     * Obtiene el Reporte General de Consolidación Financiera y Márgenes por Canal
     */
    async getFinancialOverview() {
        const expenseSummary = await this.getExpenseSummary();
        const products = await this.getAllPricingStructures();
        const totalActiveProducts = products.length;
        const totalMonthlyOperationalExpenses = expenseSummary.totalExpenseAmount;
        let totalUnitCostSum = 0;
        // Métricas por canal
        const channelStats = {
            mostrador: { marginSum: 0, sugPriceSum: 0, finalPriceSum: 0, count: 0 },
            whatsapp: { marginSum: 0, sugPriceSum: 0, finalPriceSum: 0, count: 0 },
            tiendaOnline: { marginSum: 0, sugPriceSum: 0, finalPriceSum: 0, count: 0 }
        };
        let mostProfitable;
        let leastProfitable;
        products.forEach(prod => {
            totalUnitCostSum += prod.totalUnitCost;
            ['mostrador', 'whatsapp', 'tiendaOnline'].forEach(key => {
                const metrics = prod.channels[key];
                channelStats[key].marginSum += metrics.realMarginPercentage;
                channelStats[key].sugPriceSum += metrics.suggestedPrice;
                channelStats[key].finalPriceSum += metrics.finalPrice;
                channelStats[key].count += 1;
                // Evaluar producto más y menos rentable
                if (!mostProfitable || metrics.profitAmount > mostProfitable.profitAmount) {
                    mostProfitable = {
                        productId: prod.productId,
                        productName: prod.productName,
                        maxProfitChannel: metrics.channelName,
                        profitAmount: metrics.profitAmount
                    };
                }
                if (!leastProfitable || metrics.profitAmount < leastProfitable.profitAmount) {
                    leastProfitable = {
                        productId: prod.productId,
                        productName: prod.productName,
                        minProfitChannel: metrics.channelName,
                        profitAmount: metrics.profitAmount
                    };
                }
            });
        });
        const averageProductUnitCost = totalActiveProducts > 0
            ? Number((totalUnitCostSum / totalActiveProducts).toFixed(2))
            : 0;
        const channelComparison = ['mostrador', 'whatsapp', 'tiendaOnline'].map(key => {
            const stats = channelStats[key];
            const count = stats.count > 0 ? stats.count : 1;
            const channelName = key === 'mostrador' ? 'Mostrador' : key === 'whatsapp' ? 'WhatsApp' : 'Tienda Online';
            return {
                channelKey: key,
                channelName,
                averageMarginPercentage: Number((stats.marginSum / count).toFixed(2)),
                averageSuggestedPrice: Number((stats.sugPriceSum / count).toFixed(2)),
                averageFinalPrice: Number((stats.finalPriceSum / count).toFixed(2)),
                totalPotentialRevenue: Math.round(stats.finalPriceSum)
            };
        });
        return {
            totalActiveProducts,
            totalMonthlyOperationalExpenses,
            averageProductUnitCost,
            channelComparison,
            mostProfitableProduct: mostProfitable,
            leastProfitableProduct: leastProfitable,
            generatedAt: new Date().toISOString()
        };
    }
    // =========================================================================
    // MAPPER HELPERS (CONVERSIÓN DE TABLAS POSTGRESQL A INTERFACES TYPESCRIPT)
    // =========================================================================
    mapDbExpense(row) {
        return {
            id: row.id,
            description: row.description,
            category: row.category,
            voucherType: row.voucher_type,
            voucherNumber: row.voucher_number || undefined,
            expenseDate: row.expense_date instanceof Date ? row.expense_date.toISOString().split('T')[0] : String(row.expense_date),
            amount: parseFloat(row.amount),
            paymentMethod: row.payment_method,
            supplierId: row.supplier_id || undefined,
            supplierName: row.supplier_name || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
        };
    }
    mapDbPricingStructure(row) {
        const rawMaterialCost = parseFloat(row.raw_material_cost || 0);
        const packagingLabelCost = parseFloat(row.packaging_label_cost || 0);
        const laborCost = parseFloat(row.labor_cost || 0);
        const allocatedFixedCosts = parseFloat(row.allocated_fixed_costs || 0);
        const taxPercentage = parseFloat(row.tax_percentage || 0);
        const totalDirectCost = Number((rawMaterialCost + packagingLabelCost + laborCost).toFixed(2));
        const totalUnitCost = Number((totalDirectCost + allocatedFixedCosts).toFixed(2));
        const inputDTO = {
            productId: row.product_id,
            productSku: row.product_sku,
            productName: row.product_name,
            unitOfMeasure: row.unit_of_measure,
            rawMaterialCost,
            packagingLabelCost,
            laborCost,
            allocatedFixedCosts,
            taxPercentage,
            channels: {
                mostrador: {
                    commissionPercentage: parseFloat(row.mostrador_commission_pct || 0),
                    marginPercentage: parseFloat(row.mostrador_margin_pct || 0),
                    finalPrice: parseFloat(row.mostrador_final_price || 0)
                },
                whatsapp: {
                    commissionPercentage: parseFloat(row.whatsapp_commission_pct || 0),
                    marginPercentage: parseFloat(row.whatsapp_margin_pct || 0),
                    finalPrice: parseFloat(row.whatsapp_final_price || 0)
                },
                tiendaOnline: {
                    commissionPercentage: parseFloat(row.online_commission_pct || 0),
                    marginPercentage: parseFloat(row.online_margin_pct || 0),
                    finalPrice: parseFloat(row.online_final_price || 0)
                }
            }
        };
        const calculated = this.calculatePricingStructureItem(inputDTO);
        if (row.id)
            calculated.id = row.id;
        if (row.updated_at)
            calculated.updatedAt = new Date(row.updated_at).toISOString();
        return calculated;
    }
}
exports.FinanceService = FinanceService;
