"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const supplierService_1 = require("./services/supplierService");
const supplier_1 = require("./types/supplier");
async function runTest() {
    console.log('🧪 Iniciando prueba de verificación Módulo 4: Proveedores, Recepción de Mercadería y Cuentas por Pagar...\n');
    const db = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flor_y_ser',
        idleTimeoutMillis: 1000
    });
    const supplierService = new supplierService_1.SupplierService(db);
    // 1. Probar búsqueda de proveedores (Mock / DB)
    console.log('1️⃣ Buscando proveedores registrados...');
    const suppliersResult = await supplierService.searchSuppliers();
    console.log(`✅ Total de proveedores encontrados: ${suppliersResult.total}`);
    console.log(`   Primer proveedor: ${suppliersResult.suppliers[0].businessName} (CUIT: ${suppliersResult.suppliers[0].taxId})`);
    // 2. Probar registro de un nuevo proveedor
    console.log('\n2️⃣ Registrando un nuevo proveedor...');
    const newSupplier = await supplierService.createSupplier({
        taxId: '30-99887766-5',
        businessName: 'Ecofarms Agroecológica S.A.',
        contactName: 'Laura Benítez',
        phone: '+54 9 11 3344-5566',
        email: 'contacto@ecofarms.com.ar',
        address: 'Camino Real Km 12, Luján, Bs.As.',
        categories: ['Orgánicos', 'Frutas Deshidratadas', 'Granel'],
        commercialTerms: '30 días fecha comprobante',
        deliveryDays: 'Martes'
    });
    console.log(`✅ Proveedor creado con ID: ${newSupplier.id}`);
    console.log(`   Razón Social: ${newSupplier.businessName} - Días de Entrega: ${newSupplier.deliveryDays}`);
    // 3. Registrando recepción de mercadería (Granel y Elaborados)
    console.log('\n3️⃣ Registrando recepción de mercadería (Ingreso de Granel y Elaborados)...');
    const newReceipt = await supplierService.createMerchandiseReceipt({
        receiptNumber: 'FC-A-0003-00001234',
        supplierId: newSupplier.id,
        receiptType: supplier_1.ReceiptType.FACTURA,
        issueDate: '2026-07-20',
        paymentTermsDays: 30, // Vencimiento en 30 días
        items: [
            {
                itemName: 'Nueces Mariposa Orgánicas A Granel',
                itemType: supplier_1.MerchandiseType.GRANEL,
                quantity: 30,
                unitOfMeasure: 'kg',
                unitCost: 8500,
                lotNumber: 'LOT-NUE-2026-07',
                expirationDate: '2027-07-20'
            },
            {
                itemName: 'Snack de Manzana Chips Orgánico 50g',
                itemType: supplier_1.MerchandiseType.ELABORADO,
                quantity: 50,
                unitOfMeasure: 'unidades',
                unitCost: 1200,
                lotNumber: 'LOT-CHIP-2026-07',
                expirationDate: '2026-12-31'
            }
        ],
        notes: 'Ingreso de mercadería de prueba en ambiente de desarrollo.'
    });
    console.log(`✅ Factura de compra registrada con ID: ${newReceipt.id}`);
    console.log(`   Número de Comprobante: ${newReceipt.receiptNumber}`);
    console.log(`   Monto Total: $${newReceipt.totalAmount}`);
    console.log(`   Estado de Pago Inicial: ${newReceipt.paymentStatus}`);
    console.log(`   Ítems recibidos: ${newReceipt.items.length} productos ingresados al inventario`);
    // 4. Probar registro de pago a cuenta
    console.log('\n4️⃣ Registrando un pago parcial a la factura de compra...');
    const payment = await supplierService.registerPayment({
        receiptId: newReceipt.id,
        amount: 150000,
        paymentMethod: supplier_1.SupplierPaymentMethod.TRANSFERENCIA,
        referenceNumber: 'TRX-TEST-998811',
        notes: 'Abono parcial registrado en prueba.'
    });
    console.log(`✅ Pago registrado con ID: ${payment.id}`);
    console.log(`   Monto Abonado: $${payment.amount}`);
    const updatedReceipt = await supplierService.getMerchandiseReceiptById(newReceipt.id);
    console.log(`   Nuevo Saldo Pendiente de Factura: $${updatedReceipt.pendingBalance}`);
    console.log(`   Nuevo Estado de Pago: ${updatedReceipt.paymentStatus}`);
    // 5. Consultar Calendario de Vencimientos de Cuentas por Pagar
    console.log('\n5️⃣ Consultando Calendario de Vencimientos y Resumen de Cuentas por Pagar...');
    const calendarData = await supplierService.getAccountsPayableCalendar();
    console.log(`✅ Facturas Pendientes en Calendario: ${calendarData.calendar.length}`);
    console.log(`   Total Pasivo Global a Proveedores: $${calendarData.summary.totalGlobalAccountsPayable}`);
    console.log(`   Deuda Vencida a la Fecha: $${calendarData.summary.totalOverdueAmount}`);
    console.log(`   Deuda a Vencer en Próximos 7 Días: $${calendarData.summary.totalDueNext7DaysAmount}`);
    console.log('\nDesglose de facturas en el calendario:');
    calendarData.calendar.forEach((item) => {
        console.log(`   - Factura ${item.receiptNumber} (${item.supplierName}): Saldo $${item.pendingBalance} | Vence: ${item.dueDate} | Urgencia: [${item.urgency}] (${item.daysRemainingOrOverdue} días)`);
    });
    console.log('\n🎉 ¡Módulo 4 verificado y ejecutándose al 100% de manera exitosa!');
    await db.end();
}
runTest().catch(err => {
    console.error('❌ Error en prueba:', err);
    process.exit(1);
});
