import fs from 'fs';
import path from 'path';

export function findSnapshotFile(filename: string): string | null {
  const candidates = [
    path.join(__dirname, filename),
    path.join(__dirname, '../database', filename),
    path.join(process.cwd(), 'src/database', filename),
    path.join(process.cwd(), 'dist/database', filename)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function restoreFromSnapshotData(db: any, data: any): Promise<{
  success: boolean;
  counts: Record<string, number>;
  message: string;
}> {
  const counts: Record<string, number> = {
    users: 0,
    families: 0,
    suppliers: 0,
    packaging: 0,
    rawMaterials: 0,
    finalProducts: 0,
    customers: 0,
    orders: 0,
    orderItems: 0,
    stockMovements: 0,
    pricingStructures: 0,
    expenses: 0
  };

  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Usuarios (system_users)
    const users = data.users || data.system_users || [];
    for (const u of users) {
      try {
        const modulesJson = u.allowed_modules_json
          ? u.allowed_modules_json
          : JSON.stringify(Array.isArray(u.allowedModules) ? u.allowedModules : []);
        await db.query(
          `INSERT INTO system_users (id, name, email, password_hash, visible_password, role, is_protected, allowed_modules_json, avatar_initials, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             role = VALUES(role),
             allowed_modules_json = VALUES(allowed_modules_json),
             active = VALUES(active)`,
          [
            u.id,
            u.name,
            u.email,
            u.password_hash || '$2b$10$bdWDJOTRlDF339VyM0fOgu7XSQMeKy2o2NOooR1BViXop1j0FzAyi',
            u.visible_password ?? u.password ?? null,
            u.role || 'SELLER',
            u.is_protected ?? (u.isProtected ? 1 : 0),
            modulesJson,
            u.avatar_initials ?? u.avatarInitials ?? 'US',
            u.active === false || u.active === 0 ? 0 : 1
          ]
        );
        counts.users++;
      } catch {}
    }

    // 2. Familias (article_families)
    const families = data.articleFamilies || data.families || data.article_families || [];
    for (const f of families) {
      try {
        await db.query(
          `INSERT INTO article_families (id, parent_id, code, name, description, article_scope, icon, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
           ON DUPLICATE KEY UPDATE
             parent_id = VALUES(parent_id),
             code = VALUES(code),
             name = VALUES(name),
             description = VALUES(description),
             article_scope = VALUES(article_scope),
             icon = VALUES(icon),
             sort_order = VALUES(sort_order),
             is_active = 1`,
          [
            f.id,
            f.parent_id ?? f.parentId ?? null,
            f.code,
            f.name,
            f.description ?? f.name,
            f.article_scope ?? f.articleScope ?? 'ALL',
            f.icon || 'Package',
            f.sort_order ?? f.sortOrder ?? counts.families
          ]
        );
        counts.families++;
      } catch {}
    }

    // 3. Proveedores (suppliers)
    const suppliers = data.suppliers || [];
    for (const s of suppliers) {
      try {
        await db.query(
          `INSERT INTO suppliers (id, tax_id, business_name, contact_name, phone, email, address, categories, notes, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON DUPLICATE KEY UPDATE
             business_name = VALUES(business_name),
             contact_name = VALUES(contact_name),
             phone = VALUES(phone),
             email = VALUES(email)`,
          [
            s.id,
            s.tax_id ?? s.taxId ?? null,
            s.business_name ?? s.businessName ?? s.name ?? 'Proveedor',
            s.contact_name ?? s.contactName ?? null,
            s.phone ?? null,
            s.email ?? null,
            s.address ?? null,
            typeof s.categories === 'string' ? s.categories : JSON.stringify(s.categories || []),
            s.notes ?? null,
            s.is_active === false || s.isActive === false || s.is_active === 0 ? 0 : 1
          ]
        );
        counts.suppliers++;
      } catch {}
    }

    // 4. Materiales de Empaque (packaging_materials)
    const packaging = data.packagingMaterials || data.packaging_materials || [];
    for (const p of packaging) {
      try {
        await db.query(
          `INSERT INTO packaging_materials (id, code, name, category, unit, current_stock, min_stock, cost_per_unit, supplier_name, family_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             cost_per_unit = VALUES(cost_per_unit),
             current_stock = VALUES(current_stock)`,
          [
            p.id,
            p.code,
            p.name,
            p.category || 'BOLSA',
            p.unit || 'UN',
            p.current_stock ?? p.currentStock ?? 0,
            p.min_stock ?? p.minStock ?? 10,
            p.cost_per_unit ?? p.costPerUnit ?? 0,
            p.supplier_name ?? p.supplierName ?? null,
            p.family_id ?? p.familyId ?? 'fam-empaques',
            p.is_active === false || p.isActive === false || p.is_active === 0 ? 0 : 1
          ]
        );
        counts.packaging++;
      } catch {}
    }

    // 5. Materias Primas (raw_materials)
    const rawMaterials = data.rawMaterials || data.raw_materials || [];
    for (const rm of rawMaterials) {
      try {
        await db.query(
          `INSERT INTO raw_materials (id, code, name, unit, current_stock, min_stock, cost_per_unit, supplier_name, storage_location, family_id, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             cost_per_unit = VALUES(cost_per_unit),
             current_stock = VALUES(current_stock),
             supplier_name = VALUES(supplier_name),
             family_id = VALUES(family_id)`,
          [
            rm.id,
            rm.code,
            rm.name,
            rm.unit || 'KG',
            rm.current_stock ?? rm.currentStock ?? 0,
            rm.min_stock ?? rm.minStock ?? 1,
            rm.cost_per_unit ?? rm.costPerUnit ?? 0,
            rm.supplier_name ?? rm.supplierName ?? null,
            rm.storage_location ?? rm.storageLocation ?? 'Depósito A',
            rm.family_id ?? rm.familyId ?? null,
            rm.is_active === false || rm.isActive === false || rm.is_active === 0 ? 0 : 1
          ]
        );
        counts.rawMaterials++;
      } catch {}
    }

    // 6. Productos Finales (final_products)
    const finalProducts = data.finalProducts || data.final_products || [];
    for (const fp of finalProducts) {
      try {
        const badgeCodes = Array.isArray(fp.dietaryBadgeCodes)
          ? fp.dietaryBadgeCodes.join(',')
          : (fp.dietary_badge_codes || '');
        await db.query(
          `INSERT INTO final_products (
             id, raw_material_id, code, barcode, name, unit_weight_grams, unit, net_content_label,
             current_stock, min_stock, cost_price, price, ingredients, dietary_badge_codes,
             default_expiration_days, family_id, is_blend, is_resale, supplier_name, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             price = VALUES(price),
             cost_price = VALUES(cost_price),
             current_stock = VALUES(current_stock),
             family_id = VALUES(family_id),
             is_resale = VALUES(is_resale),
             supplier_name = VALUES(supplier_name)`,
          [
            fp.id,
            fp.raw_material_id ?? fp.rawMaterialId ?? null,
            fp.code,
            fp.barcode || fp.code,
            fp.name,
            fp.unit_weight_grams ?? fp.unitWeightGrams ?? 100,
            fp.unit || 'GRS',
            fp.net_content_label ?? fp.netContentLabel ?? '100g',
            fp.current_stock ?? fp.currentStock ?? 0,
            fp.min_stock ?? fp.minStock ?? 1,
            fp.cost_price ?? fp.costPrice ?? 0,
            fp.price ?? fp.salePrice ?? 0,
            fp.ingredients || null,
            badgeCodes,
            fp.default_expiration_days ?? fp.defaultExpirationDays ?? 180,
            fp.family_id ?? fp.familyId ?? null,
            fp.is_blend ?? fp.isBlend ? 1 : 0,
            fp.is_resale ?? fp.isResale ? 1 : 0,
            fp.supplier_name ?? fp.supplierName ?? null,
            fp.is_active === false || fp.isActive === false || fp.is_active === 0 ? 0 : 1
          ]
        );
        counts.finalProducts++;
      } catch {}
    }

    // 7. Clientes CRM (customers)
    const customers = data.customers || [];
    for (const c of customers) {
      try {
        await db.query(
          `INSERT INTO customers (
             id, first_name, last_name, phone_whatsapp, email, instagram, address, birth_date,
             preferred_channel, points_balance, is_active, notes, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON DUPLICATE KEY UPDATE
             first_name = VALUES(first_name),
             last_name = VALUES(last_name),
             phone_whatsapp = VALUES(phone_whatsapp),
             instagram = COALESCE(VALUES(instagram), instagram),
             preferred_channel = VALUES(preferred_channel),
             notes = COALESCE(VALUES(notes), notes)`,
          [
            c.id,
            c.first_name ?? c.firstName ?? 'Cliente',
            c.last_name ?? c.lastName ?? '',
            c.phone_whatsapp ?? c.phoneWhatsapp ?? '',
            c.email || null,
            c.instagram || null,
            c.address || null,
            c.birth_date ?? c.birthDate ?? null,
            c.preferred_channel ?? c.preferredChannel ?? 'LOCAL',
            c.points_balance ?? c.pointsBalance ?? 0,
            c.is_active === false || c.isActive === false || c.is_active === 0 ? 0 : 1,
            c.notes || null,
            c.created_at ?? (c.createdAt ? c.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19))
          ]
        );
        counts.customers++;
      } catch {}
    }

    // 8. Ventas / Pedidos (orders y order_items)
    const orders = data.orders || [];
    for (const o of orders) {
      try {
        await db.query(
          `INSERT INTO orders (
             id, order_number, customer_id, seller_id, seller_name, quote_id, channel, status,
             payment_status, payment_method, subtotal, discount_amount, delivery_fee, total_amount,
             paid_amount, balance_due, points_earned, commission_amount, commission_settled,
             delivery_address, notes, is_verified, verified_by, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             payment_status = VALUES(payment_status),
             total_amount = VALUES(total_amount)`,
          [
            o.id,
            o.order_number ?? o.orderNumber,
            o.customer_id ?? o.customerId,
            o.seller_id ?? o.sellerId ?? null,
            o.seller_name ?? o.sellerName ?? null,
            o.quote_id ?? o.quoteId ?? null,
            o.channel || 'LOCAL',
            o.status || 'RECEIVED',
            o.payment_status ?? o.paymentStatus ?? 'PAID',
            o.payment_method ?? o.paymentMethod ?? 'EFECTIVO',
            o.subtotal ?? o.totalAmount ?? 0,
            o.discount_amount ?? o.discountAmount ?? 0,
            o.delivery_fee ?? o.deliveryFee ?? 0,
            o.total_amount ?? o.totalAmount ?? 0,
            o.paid_amount ?? o.paidAmount ?? 0,
            o.balance_due ?? o.balanceDue ?? 0,
            o.points_earned ?? o.pointsEarned ?? 0,
            o.commission_amount ?? o.commissionAmount ?? 0,
            o.commission_settled ?? o.commissionSettled ? 1 : 0,
            o.delivery_address ?? o.deliveryAddress ?? null,
            o.notes || null,
            o.is_verified ?? o.isVerified ? 1 : 0,
            o.verified_by ?? o.verifiedBy ?? null,
            o.created_at ?? (o.createdAt ? o.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19))
          ]
        );
        counts.orders++;

        const items = o.items || [];
        for (const it of items) {
          try {
            await db.query(
              `INSERT INTO order_items (id, order_id, product_name, product_id, is_bulk_fractioned, quantity, unit_price, subtotal)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON DUPLICATE KEY UPDATE
                 quantity = VALUES(quantity),
                 unit_price = VALUES(unit_price),
                 subtotal = VALUES(subtotal)`,
              [
                it.id,
                it.order_id ?? it.orderId ?? o.id,
                it.product_name ?? it.productName ?? 'Producto',
                it.product_id ?? it.productId ?? null,
                it.is_bulk_fractioned ?? it.isBulkFractioned ? 1 : 0,
                it.quantity ?? 1,
                it.unit_price ?? it.unitPrice ?? 0,
                it.subtotal ?? 0
              ]
            );
            counts.orderItems++;
          } catch {}
        }
      } catch {}
    }

    // 9. Movimientos de Kardex (stock_movements)
    const movements = data.stockMovements || data.stock_movements || [];
    for (const m of movements) {
      try {
        await db.query(
          `INSERT INTO stock_movements (
             id, item_type, item_id, item_name, movement_type, quantity, previous_stock, resulting_stock,
             unit_of_measure, unit_cost, reference_type, reference_id, reference_number, reason, user_name, notes, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON DUPLICATE KEY UPDATE resulting_stock = VALUES(resulting_stock)`,
          [
            m.id,
            m.item_type ?? m.itemType ?? 'FINAL_PRODUCT',
            m.item_id ?? m.itemId ?? 'N/A',
            m.item_name ?? m.itemName ?? 'Artículo',
            m.movement_type ?? m.movementType ?? 'ADJUSTMENT',
            m.quantity ?? 0,
            m.previous_stock ?? m.previousStock ?? 0,
            m.resulting_stock ?? m.resultingStock ?? 0,
            m.unit_of_measure ?? m.unitOfMeasure ?? 'UN',
            m.unit_cost ?? m.unitCost ?? 0,
            m.reference_type ?? m.referenceType ?? null,
            m.reference_id ?? m.referenceId ?? null,
            m.reference_number ?? m.referenceNumber ?? null,
            m.reason || null,
            m.user_name ?? m.userName ?? null,
            m.notes || null,
            m.created_at ?? (m.createdAt ? m.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19))
          ]
        );
        counts.stockMovements++;
      } catch {}
    }

    // 10. Estructuras de Precios (product_pricing_structures)
    const pricingStructures = data.pricingStructures || data.product_pricing_structures || [];
    for (const ps of pricingStructures) {
      try {
        const ch = ps.channels || {};
        await db.query(
          `INSERT INTO product_pricing_structures (
             id, product_id, product_sku, product_name, unit_of_measure, raw_material_cost,
             packaging_label_cost, labor_cost, allocated_fixed_costs, tax_percentage,
             mostrador_commission_pct, mostrador_margin_pct, mostrador_suggested_price, mostrador_final_price,
             whatsapp_commission_pct, whatsapp_margin_pct, whatsapp_suggested_price, whatsapp_final_price,
             online_commission_pct, online_margin_pct, online_suggested_price, online_final_price
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
           ON DUPLICATE KEY UPDATE
             mostrador_final_price = VALUES(mostrador_final_price),
             whatsapp_final_price = VALUES(whatsapp_final_price),
             online_final_price = VALUES(online_final_price)`,
          [
            ps.id,
            ps.product_id ?? ps.productId,
            ps.product_sku ?? ps.productSku ?? null,
            ps.product_name ?? ps.productName ?? 'Producto',
            ps.unit_of_measure ?? ps.unitOfMeasure ?? 'unidades',
            ps.raw_material_cost ?? ps.rawMaterialCost ?? 0,
            ps.packaging_label_cost ?? ps.packagingLabelCost ?? 0,
            ps.labor_cost ?? ps.laborCost ?? 0,
            ps.allocated_fixed_costs ?? ps.allocatedFixedCosts ?? 0,
            ps.tax_percentage ?? ps.taxPercentage ?? 21,
            ps.mostrador_commission_pct ?? ch.mostrador?.commissionPercentage ?? 0,
            ps.mostrador_margin_pct ?? ch.mostrador?.marginPercentage ?? 35,
            ps.mostrador_suggested_price ?? ch.mostrador?.suggestedPrice ?? 0,
            ps.mostrador_final_price ?? ch.mostrador?.finalPrice ?? 0,
            ps.whatsapp_commission_pct ?? ch.whatsapp?.commissionPercentage ?? 0,
            ps.whatsapp_margin_pct ?? ch.whatsapp?.marginPercentage ?? 30,
            ps.whatsapp_suggested_price ?? ch.whatsapp?.suggestedPrice ?? 0,
            ps.whatsapp_final_price ?? ch.whatsapp?.finalPrice ?? 0,
            ps.online_commission_pct ?? ch.tiendaOnline?.commissionPercentage ?? 0,
            ps.online_margin_pct ?? ch.tiendaOnline?.marginPercentage ?? 25,
            ps.online_suggested_price ?? ch.tiendaOnline?.suggestedPrice ?? 0,
            ps.online_final_price ?? ch.tiendaOnline?.finalPrice ?? 0
          ]
        );
        counts.pricingStructures++;
      } catch {}
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1;');

    return {
      success: true,
      counts,
      message: `Backup restaurado exitosamente (${counts.customers} clientes, ${counts.orders} ventas, ${counts.rawMaterials} materias primas, ${counts.finalProducts} productos finales).`
    };
  } catch (error: any) {
    try { await db.query('SET FOREIGN_KEY_CHECKS = 1;'); } catch {}
    return {
      success: false,
      counts,
      message: error.message || 'Error al restaurar desde snapshot'
    };
  }
}

export async function importCatalogSeed(db: any): Promise<{ success: boolean; counts?: any; message?: string }> {
  try {
    // Priorizar el snapshot real completo (liveBackupSnapshot.json) si está disponible
    const liveSnapPath = findSnapshotFile('liveBackupSnapshot.json');
    if (liveSnapPath) {
      const snapData = JSON.parse(fs.readFileSync(liveSnapPath, 'utf-8'));
      console.log('📦 Restaurando estado completo desde liveBackupSnapshot.json...');
      const res = await restoreFromSnapshotData(db, snapData);
      await reconstructFromSurvivingTables(db);
      return res;
    }

    // Fallback a catalogSeedData.json si no existiera liveBackupSnapshot.json
    const seedPath = findSnapshotFile('catalogSeedData.json');
    if (!seedPath) {
      console.warn('⚠️ Archivo catalogSeedData.json no encontrado.');
      return { success: false, message: 'Archivo de catálogo no encontrado' };
    }

    const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    console.log('📦 Iniciando importación y sincronización de catálogo desde Costos SISTEMA...');

    await db.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Familias
    let famCount = 0;
    for (const f of data.families || []) {
      try {
        await db.query(`
          INSERT INTO article_families (id, parent_id, code, name, description, article_scope, icon, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
          ON DUPLICATE KEY UPDATE
            parent_id = VALUES(parent_id),
            code = VALUES(code),
            name = VALUES(name),
            description = VALUES(description),
            article_scope = VALUES(article_scope),
            icon = VALUES(icon),
            sort_order = VALUES(sort_order),
            is_active = 1;
        `, [f.id, f.parent_id || null, f.code, f.name, f.name, f.article_scope || 'ALL', f.icon || 'Package', f.sort_order ?? famCount]);
        famCount++;
      } catch (err: any) {
        // Ignorar duplicados
      }
    }

    // 2. Proveedores
    let supCount = 0;
    for (const s of data.suppliers || []) {
      try {
        await db.query(`
          INSERT INTO suppliers (id, tax_id, business_name, contact_name, phone, email, categories, notes, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
          ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), contact_name = VALUES(contact_name);
        `, [s.id, s.tax_id, s.business_name, s.contact_name, s.phone, s.email, s.categories, s.notes]);
        supCount++;
      } catch (err: any) {
        // Ignorar duplicados
      }
    }

    // 3. Materiales de Empaque
    let pkgCount = 0;
    for (const p of data.packaging_materials || []) {
      try {
        await db.query(`
          INSERT INTO packaging_materials (id, code, name, category, unit, current_stock, min_stock, cost_per_unit, supplier_name, family_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), cost_per_unit = VALUES(cost_per_unit), current_stock = VALUES(current_stock);
        `, [p.id, p.code, p.name, p.category, p.unit, p.current_stock, p.min_stock, p.cost_per_unit, p.supplier_name, p.family_id]);
        pkgCount++;
      } catch (err: any) {
        // Ignorar
      }
    }

    // 4. Materias Primas (Granel)
    let rmCount = 0;
    for (const rm of data.raw_materials || []) {
      try {
        await db.query(`
          INSERT INTO raw_materials (id, code, name, unit, current_stock, min_stock, cost_per_unit, storage_location, family_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), cost_per_unit = VALUES(cost_per_unit), family_id = VALUES(family_id);
        `, [rm.id, rm.code, rm.name, rm.unit, rm.current_stock, rm.min_stock, rm.cost_per_unit, rm.storage_location, rm.family_id]);
        rmCount++;
      } catch (err: any) {
        // Ignorar
      }
    }

    // 5. Productos Finales
    let fpCount = 0;
    for (const fp of data.final_products || []) {
      try {
        await db.query(`
          INSERT INTO final_products (
            id, raw_material_id, code, barcode, name, unit_weight_grams, net_content_label,
            current_stock, min_stock, cost_price, price, ingredients, dietary_badge_codes,
            default_expiration_days, family_id, is_blend, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), cost_price = VALUES(cost_price), family_id = VALUES(family_id);
        `, [
          fp.id, fp.raw_material_id, fp.code, fp.barcode, fp.name, fp.unit_weight_grams, fp.net_content_label,
          fp.current_stock, fp.min_stock, fp.cost_price, fp.price, fp.ingredients, fp.dietary_badge_codes,
          fp.default_expiration_days, fp.family_id, fp.is_blend
        ]);
        fpCount++;
      } catch (err: any) {
        // Ignorar
      }
    }

    // 6. Productos POS / Venta
    let pCount = 0;
    for (const p of data.products || []) {
      try {
        await db.query(`
          INSERT INTO products (
            id, sku, name, product_type, unit_of_measure, current_stock, min_stock,
            cost_price, sale_price, category, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
          ON DUPLICATE KEY UPDATE name = VALUES(name), sale_price = VALUES(sale_price), cost_price = VALUES(cost_price);
        `, [
          p.id, p.sku, p.name, p.product_type, p.unit_of_measure, p.current_stock, p.min_stock,
          p.cost_price, p.sale_price, p.category
        ]);
        pCount++;
      } catch (err: any) {
        // Ignorar
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 7. Reconstruir stock, costos, precios y artículos personalizados desde las tablas que sobrevivieron (stock_movements, products, product_pricing_structures)
    const reconstructed = await reconstructFromSurvivingTables(db);

    console.log(`✅ Catálogo importado y reconstruido exitosamente:
      - Familias: ${famCount}
      - Proveedores: ${supCount}
      - Materiales de Empaque: ${pkgCount}
      - Materias Primas: ${rmCount}
      - Productos Finales: ${fpCount}
      - Productos POS: ${pCount}
      - Stock/Artículos recuperados de Kardex y Precios: ${reconstructed.recoveredItems}`);

    return {
      success: true,
      counts: {
        families: famCount,
        suppliers: supCount,
        packaging: pkgCount,
        rawMaterials: rmCount,
        finalProducts: fpCount,
        products: pCount,
        recoveredFromKardexAndPricing: reconstructed.recoveredItems
      }
    };
  } catch (error: any) {
    console.error('❌ Error en importCatalogSeed:', error.message);
    try { await db.query('SET FOREIGN_KEY_CHECKS = 1;'); } catch {}
    return { success: false, message: error.message };
  }
}

/**
 * Reconstruye stock actual, costos, precios personalizados y artículos creados por el usuario
 * a partir de las tablas que no fueron afectadas (stock_movements, product_pricing_structures, products).
 */
export async function reconstructFromSurvivingTables(db: any): Promise<{ recoveredItems: number }> {
  let recoveredItems = 0;

  try {
    // A. Recuperar precios y productos desde product_pricing_structures
    try {
      const pricingRes = await db.query('SELECT * FROM product_pricing_structures');
      for (const row of pricingRes.rows || []) {
        const finalPrice = parseFloat(row.mostrador_final_price || row.mostrador_suggested_price || '0');
        const rawCost = parseFloat(row.raw_material_cost || '0');
        if (finalPrice > 0 || rawCost > 0) {
          const checkFp = await db.query(
            'SELECT id FROM final_products WHERE id = $1 OR code = $2 OR LOWER(name) = LOWER($3)',
            [row.product_id, row.product_sku || '', row.product_name || '']
          );
          if (checkFp.rows && checkFp.rows.length > 0) {
            await db.query(
              `UPDATE final_products
               SET price = CASE WHEN $1 > 0 THEN $1 ELSE price END,
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3`,
              [finalPrice, rawCost, checkFp.rows[0].id]
            );
            recoveredItems++;
          } else if (row.product_name) {
            const code = row.product_sku || ('PF-' + row.product_id.slice(0, 6).toUpperCase());
            await db.query(
              `INSERT INTO final_products (id, code, name, unit_weight_grams, net_content_label, current_stock, min_stock, cost_price, price, is_active)
               VALUES ($1, $2, $3, 100, '100g', 0, 5, $4, $5, 1)
               ON DUPLICATE KEY UPDATE price = VALUES(price), cost_price = VALUES(cost_price)`,
              [row.product_id, code, row.product_name, rawCost, finalPrice]
            );
            recoveredItems++;
          }
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Nota en reconstrucción desde product_pricing_structures:', e.message);
    }

    // B. Recuperar stock y artículos desde la tabla `products` (que no estaba en tablesToPurge)
    try {
      const prodRes = await db.query('SELECT * FROM products WHERE current_stock > 0 OR cost_price > 0');
      for (const p of prodRes.rows || []) {
        const stock = parseFloat(p.current_stock || '0');
        const cost = parseFloat(p.cost_price || '0');
        if (stock > 0 || cost > 0) {
          const isGranel = (p.product_type || '').toUpperCase().includes('GRANEL') || (p.unit_of_measure || '').toUpperCase() === 'KG';
          if (isGranel) {
            const rmUpd = await db.query(
              `UPDATE raw_materials
               SET current_stock = GREATEST(current_stock, $1),
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3 OR code = $4 OR LOWER(name) = LOWER($5)`,
              [stock, cost, p.id, p.sku || '', p.name || '']
            );
            if ((rmUpd.rowCount || 0) > 0) recoveredItems++;
          } else {
            const fpUpd = await db.query(
              `UPDATE final_products
               SET current_stock = GREATEST(current_stock, $1),
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3 OR code = $4 OR LOWER(name) = LOWER($5)`,
              [stock, cost, p.id, p.sku || '', p.name || '']
            );
            if ((fpUpd.rowCount || 0) > 0) recoveredItems++;
          }
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Nota en reconstrucción desde products:', e.message);
    }

    // C. Reconstruir stock e ítems desde `stock_movements` (Kardex intacto)
    try {
      const movRes = await db.query('SELECT * FROM stock_movements ORDER BY created_at ASC');
      const itemMap = new Map<string, {
        itemType: string;
        itemId: string;
        itemName: string;
        stock: number;
        unit: string;
        unitCost: number;
      }>();

      for (const m of movRes.rows || []) {
        const key = `${m.item_type}::${m.item_id !== 'N/A' && m.item_id ? m.item_id : m.item_name}`;
        const prev = itemMap.get(key) || {
          itemType: m.item_type,
          itemId: m.item_id,
          itemName: m.item_name,
          stock: 0,
          unit: m.unit_of_measure || 'UN',
          unitCost: 0
        };

        const resStock = parseFloat(m.resulting_stock || '0');
        const qty = parseFloat(m.quantity || '0');
        const cost = parseFloat(m.unit_cost || '0');

        if (resStock > 0 || (m.movement_type === 'MANUAL_ADJUSTMENT' && m.resulting_stock !== null)) {
          prev.stock = resStock;
        } else {
          prev.stock = Math.max(0, prev.stock + qty);
        }

        if (cost > 0) prev.unitCost = cost;
        if (m.item_name) prev.itemName = m.item_name;
        itemMap.set(key, prev);
      }

      for (const [, info] of itemMap.entries()) {
        if (info.itemType === 'RAW_MATERIAL') {
          const check = await db.query(
            'SELECT id FROM raw_materials WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)',
            [info.itemId, info.itemName]
          );
          if (check.rows && check.rows.length > 0) {
            await db.query(
              `UPDATE raw_materials
               SET current_stock = $1,
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3`,
              [info.stock, info.unitCost, check.rows[0].id]
            );
            recoveredItems++;
          } else if (info.itemName) {
            const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('rm-rec-' + Date.now() + Math.floor(Math.random() * 100));
            const newCode = 'MP-REC-' + Math.floor(1000 + Math.random() * 9000);
            await db.query(
              `INSERT INTO raw_materials (id, code, name, unit, current_stock, min_stock, cost_per_unit, is_active)
               VALUES ($1, $2, $3, $4, $5, 5, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`,
              [newId, newCode, info.itemName, info.unit || 'KG', info.stock, info.unitCost]
            );
            recoveredItems++;
          }
        } else if (info.itemType === 'PACKAGING') {
          const check = await db.query(
            'SELECT id FROM packaging_materials WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)',
            [info.itemId, info.itemName]
          );
          if (check.rows && check.rows.length > 0) {
            await db.query(
              `UPDATE packaging_materials
               SET current_stock = $1,
                   cost_per_unit = CASE WHEN $2 > 0 THEN $2 ELSE cost_per_unit END
               WHERE id = $3`,
              [info.stock, info.unitCost, check.rows[0].id]
            );
            recoveredItems++;
          } else if (info.itemName) {
            const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('pkg-rec-' + Date.now() + Math.floor(Math.random() * 100));
            const newCode = 'EMP-REC-' + Math.floor(1000 + Math.random() * 9000);
            await db.query(
              `INSERT INTO packaging_materials (id, code, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
               VALUES ($1, $2, $3, 'OTHER', $4, $5, 10, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`,
              [newId, newCode, info.itemName, info.unit || 'UN', info.stock, info.unitCost]
            );
            recoveredItems++;
          }
        } else if (info.itemType === 'FINAL_PRODUCT') {
          const check = await db.query(
            'SELECT id FROM final_products WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($2)',
            [info.itemId, info.itemName]
          );
          if (check.rows && check.rows.length > 0) {
            await db.query(
              `UPDATE final_products
               SET current_stock = $1,
                   cost_price = CASE WHEN $2 > 0 THEN $2 ELSE cost_price END
               WHERE id = $3`,
              [info.stock, info.unitCost, check.rows[0].id]
            );
            recoveredItems++;
          } else if (info.itemName) {
            const newId = info.itemId && info.itemId !== 'N/A' ? info.itemId : ('fp-rec-' + Date.now() + Math.floor(Math.random() * 100));
            const newCode = 'PF-REC-' + Math.floor(1000 + Math.random() * 9000);
            await db.query(
              `INSERT INTO final_products (id, code, name, unit_weight_grams, net_content_label, current_stock, min_stock, cost_price, price, is_active)
               VALUES ($1, $2, $3, 100, '100g', $4, 5, $5, $6, 1)
               ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock)`,
              [newId, newCode, info.itemName, info.stock, info.unitCost, info.unitCost * 1.5]
            );
            recoveredItems++;
          }
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Nota en reconstrucción desde stock_movements:', e.message);
    }
  } catch (err: any) {
    console.warn('⚠️ Error general en reconstructFromSurvivingTables:', err.message);
  }

  return { recoveredItems };
}
