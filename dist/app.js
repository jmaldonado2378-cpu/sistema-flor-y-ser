"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
const customerService_1 = require("./services/customerService");
const customerController_1 = require("./controllers/customerController");
const dietaryService_1 = require("./services/dietaryService");
const dietaryController_1 = require("./controllers/dietaryController");
const checkingAccountService_1 = require("./services/checkingAccountService");
const checkingAccountController_1 = require("./controllers/checkingAccountController");
const paymentService_1 = require("./services/paymentService");
const paymentController_1 = require("./controllers/paymentController");
const saleService_1 = require("./services/saleService");
const saleController_1 = require("./controllers/saleController");
const quoteService_1 = require("./services/quoteService");
const quoteController_1 = require("./controllers/quoteController");
const supplierService_1 = require("./services/supplierService");
const supplierController_1 = require("./controllers/supplierController");
const taskService_1 = require("./services/taskService");
const taskController_1 = require("./controllers/taskController");
const financeService_1 = require("./services/financeService");
const financeController_1 = require("./controllers/financeController");
const settingsService_1 = require("./services/settingsService");
const settingsController_1 = require("./controllers/settingsController");
const marketingService_1 = require("./services/marketingService");
const marketingController_1 = require("./controllers/marketingController");
const rawMaterialService_1 = require("./services/rawMaterialService");
const rawMaterialController_1 = require("./controllers/rawMaterialController");
const packagingService_1 = require("./services/packagingService");
const packagingController_1 = require("./controllers/packagingController");
const articleFamilyService_1 = require("./services/articleFamilyService");
const articleFamilyController_1 = require("./controllers/articleFamilyController");
const finalProductService_1 = require("./services/finalProductService");
const finalProductController_1 = require("./controllers/finalProductController");
const fractioningService_1 = require("./services/fractioningService");
const fractioningController_1 = require("./controllers/fractioningController");
const labelPrintingService_1 = require("./services/labelPrintingService");
const labelPrintingController_1 = require("./controllers/labelPrintingController");
const reportsService_1 = require("./services/reportsService");
const reportsController_1 = require("./controllers/reportsController");
const fidelizationService_1 = require("./services/fidelizationService");
const fidelizationController_1 = require("./controllers/fidelizationController");
const automationService_1 = require("./services/automationService");
const automationController_1 = require("./controllers/automationController");
const authService_1 = require("./services/authService");
const authController_1 = require("./controllers/authController");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
// Configuración de PostgreSQL Pool
const db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flor_y_ser',
    idleTimeoutMillis: 30000,
});
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Archivos estáticos del frontend (React SPA dist o public)
const frontendDist = path_1.default.join(__dirname, '../frontend/dist');
const publicDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(fs_1.default.existsSync(frontendDist) ? frontendDist : publicDir));
// Inicialización de Servicios y Controladores Módulo 1 & 2
const customerService = new customerService_1.CustomerService(db);
const customerController = new customerController_1.CustomerController(customerService);
const dietaryService = new dietaryService_1.DietaryService(db);
const dietaryController = new dietaryController_1.DietaryController(dietaryService);
// Inicialización de Servicios y Controladores Módulo 3
const checkingAccountService = new checkingAccountService_1.CheckingAccountService(db);
const checkingAccountController = new checkingAccountController_1.CheckingAccountController(checkingAccountService);
const paymentService = new paymentService_1.PaymentService(db, checkingAccountService);
const paymentController = new paymentController_1.PaymentController(paymentService);
const saleService = new saleService_1.SaleService(db, paymentService, customerService);
const saleController = new saleController_1.SaleController(saleService);
const quoteService = new quoteService_1.QuoteService(db, saleService);
const quoteController = new quoteController_1.QuoteController(quoteService);
// Inicialización de Servicios y Controladores Módulo 4: Proveedores, Mercadería y Cuentas por Pagar
const supplierService = new supplierService_1.SupplierService(db);
const supplierController = new supplierController_1.SupplierController(supplierService);
// Inicialización Módulo Tareas Operativas & Kanban
const taskService = new taskService_1.TaskService(db, saleService);
const taskController = new taskController_1.TaskController(taskService);
// Inicialización Módulo Finanzas, Gastos y Estructura de Precios & Costos
const financeService = new financeService_1.FinanceService(db);
const financeController = new financeController_1.FinanceController(financeService);
// Inicialización Módulo Configuración del Sistema
const settingsService = new settingsService_1.SettingsService(db);
const settingsController = new settingsController_1.SettingsController(settingsService);
// Inicialización Módulo WhatsApp Marketing
const marketingService = new marketingService_1.MarketingService(db, customerService);
const marketingController = new marketingController_1.MarketingController(marketingService);
// Inicialización Módulo Inventario: Materias Primas, Empaques y Productos Finales
const rawMaterialService = new rawMaterialService_1.RawMaterialService(db);
const rawMaterialController = new rawMaterialController_1.RawMaterialController(rawMaterialService);
const packagingService = new packagingService_1.PackagingService(db);
const packagingController = new packagingController_1.PackagingController(packagingService);
const articleFamilyService = new articleFamilyService_1.ArticleFamilyService(db);
const articleFamilyController = new articleFamilyController_1.ArticleFamilyController(articleFamilyService);
const finalProductService = new finalProductService_1.FinalProductService(db);
const finalProductController = new finalProductController_1.FinalProductController(finalProductService);
// Inicialización Módulo Fraccionado
const fractioningService = new fractioningService_1.FractioningService(db, rawMaterialService, finalProductService, taskService);
const fractioningController = new fractioningController_1.FractioningController(fractioningService);
taskService.setFractioningService(fractioningService);
// Inicialización Módulo Etiquetas
const labelPrintingService = new labelPrintingService_1.LabelPrintingService();
const labelPrintingController = new labelPrintingController_1.LabelPrintingController(labelPrintingService);
// Inicialización Módulo Reportes y KPIs
const reportsService = new reportsService_1.ReportsService(db);
const reportsController = new reportsController_1.ReportsController(reportsService);
// Inicialización Módulo Fidelización de Clientes
const fidelizationService = new fidelizationService_1.FidelizationService(db, customerService);
const fidelizationController = new fidelizationController_1.FidelizationController(fidelizationService);
// Inicialización Módulo Automatizaciones WhatsApp
const automationService = new automationService_1.AutomationService(db, customerService);
const automationController = new automationController_1.AutomationController(automationService);
// Inicialización Módulo Autenticación & Usuarios
const authService = new authService_1.AuthService(db);
const authController = new authController_1.AuthController(authService);
// Rutas API REST v1 - Autenticación
app.post('/api/v1/auth/login', authController.login);
// Rutas API REST v1 - CRM & Clientes
app.get('/api/v1/customers', customerController.getAll);
app.post('/api/v1/customers', customerController.create);
app.get('/api/v1/customers/:id', customerController.getUnifiedProfile);
app.get('/api/v1/customers/:id/unified-profile', customerController.getUnifiedProfile);
app.put('/api/v1/customers/:id', customerController.update);
app.delete('/api/v1/customers/:id', customerController.delete);
app.get('/api/v1/dietary-profiles', dietaryController.getAll);
app.post('/api/v1/dietary-profiles', dietaryController.create);
// Rutas API REST v1 - Módulo 3: Ventas, Cobros, Cuentas Corrientes y Presupuestos
// 1. Ventas / Pedidos
app.post('/api/v1/sales/orders', saleController.create);
app.get('/api/v1/sales/orders', saleController.getAll);
app.get('/api/v1/sales/orders/:id', saleController.getById);
app.patch('/api/v1/sales/orders/:id/status', saleController.updateStatus);
// 2. Cobros (Efectivo, Mercado Pago, Transferencia)
app.post('/api/v1/sales/payments', paymentController.register);
app.get('/api/v1/sales/payments/:id', paymentController.getById);
app.get('/api/v1/sales/customers/:customerId/payments', paymentController.getByCustomer);
app.get('/api/v1/sales/orders/:orderId/payments', paymentController.getByOrder);
// 3. Cuentas Corrientes de Clientes & Extractos Detallados
app.get('/api/v1/sales/checking-accounts', checkingAccountController.getAllAccounts);
app.get('/api/v1/sales/customers/:customerId/checking-account', checkingAccountController.getSummary);
app.get('/api/v1/sales/customers/:customerId/checking-account/statement', checkingAccountController.getStatement);
app.post('/api/v1/sales/customers/:customerId/checking-account/collections', checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/payments', checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/adjustments', checkingAccountController.addManualAdjustment);
app.patch('/api/v1/sales/customers/:customerId/checking-account/credit-limit', checkingAccountController.updateCreditLimit);
// 4. Presupuestos Convertibles a Pedidos en 1 Clic
app.post('/api/v1/sales/quotes', quoteController.create);
app.get('/api/v1/sales/quotes', quoteController.getAll);
app.get('/api/v1/sales/quotes/:id', quoteController.getById);
app.patch('/api/v1/sales/quotes/:id', quoteController.update);
app.post('/api/v1/sales/quotes/:id/convert-to-order', quoteController.convertToOrder);
// Rutas API REST v1 - Módulo 4: Proveedores, Recepción de Mercadería y Cuentas por Pagar
app.post('/api/v1/suppliers', supplierController.createSupplier);
app.get('/api/v1/suppliers', supplierController.searchSuppliers);
app.get('/api/v1/suppliers/:id', supplierController.getSupplierById);
app.put('/api/v1/suppliers/:id', supplierController.updateSupplier);
app.delete('/api/v1/suppliers/:id', supplierController.deleteSupplier);
app.post('/api/v1/merchandise-receipts', supplierController.createMerchandiseReceipt);
app.post('/api/v1/merchandise-receipts/raw', supplierController.createRawMaterialReceipt);
app.get('/api/v1/merchandise-receipts', supplierController.searchMerchandiseReceipts);
app.get('/api/v1/merchandise-receipts/:id', supplierController.getMerchandiseReceiptById);
app.post('/api/v1/accounts-payable/payments', supplierController.registerPayment);
app.get('/api/v1/accounts-payable/receipts/:id/payments', supplierController.getPaymentsByReceipt);
app.get('/api/v1/accounts-payable/calendar', supplierController.getAccountsPayableCalendar);
// 1. Gastos Operativos
app.get('/api/v1/finance/expenses', financeController.getExpenses);
app.get('/api/v1/finance/expenses/summary', financeController.getExpenseSummary);
app.post('/api/v1/finance/expenses', financeController.createExpense);
app.put('/api/v1/finance/expenses/:id', financeController.updateExpense);
app.delete('/api/v1/finance/expenses/:id', financeController.deleteExpense);
// 2. Estructura de Precios y Costos por Canal
app.get('/api/v1/finance/pricing-structure', financeController.getAllPricingStructures);
app.get('/api/v1/finance/pricing-structure/overview', financeController.getFinancialOverview);
app.get('/api/v1/finance/pricing-structure/:productId', financeController.getPricingStructureByProductId);
app.post('/api/v1/finance/pricing-structure/calculate-preview', financeController.calculatePreview);
app.post('/api/v1/finance/pricing-structure', financeController.savePricingStructure);
app.post('/api/v1/finance/pricing-structure/allocate-fixed-costs', financeController.allocateFixedCosts);
// Rutas API REST v1 - Módulo de Tareas Operativas & Tableros Kanban
app.post('/api/v1/tasks', taskController.create);
app.get('/api/v1/tasks', taskController.getAll);
app.get('/api/v1/tasks/kanban/board', taskController.getKanbanBoard);
app.get('/api/v1/tasks/sales-kanban/board', taskController.getSalesKanbanBoard);
app.get('/api/v1/tasks/:id', taskController.getById);
app.put('/api/v1/tasks/:id', taskController.update);
app.patch('/api/v1/tasks/:id/status', taskController.updateStatus);
app.delete('/api/v1/tasks/:id', taskController.delete);
// Rutas API REST v1 - Configuración del Sistema
app.get('/api/v1/settings', settingsController.getSettings);
app.put('/api/v1/settings', settingsController.updateSettings);
app.patch('/api/v1/settings/business-info', settingsController.updateBusinessInfo);
app.patch('/api/v1/settings/print', settingsController.updatePrintSettings);
app.patch('/api/v1/settings/commissions', settingsController.updateChannelCommissions);
// Rutas API REST v1 - WhatsApp Marketing (Plantillas & Campañas)
app.get('/api/v1/marketing/templates', marketingController.getTemplates);
app.get('/api/v1/marketing/templates/:id', marketingController.getTemplateById);
app.post('/api/v1/marketing/templates', marketingController.createTemplate);
app.put('/api/v1/marketing/templates/:id', marketingController.updateTemplate);
app.delete('/api/v1/marketing/templates/:id', marketingController.deleteTemplate);
app.get('/api/v1/marketing/campaigns', marketingController.getCampaigns);
app.get('/api/v1/marketing/campaigns/:id', marketingController.getCampaignById);
app.post('/api/v1/marketing/campaigns', marketingController.createCampaign);
app.put('/api/v1/marketing/campaigns/:id', marketingController.updateCampaign);
app.post('/api/v1/marketing/campaigns/audience-preview', marketingController.previewAudience);
app.post('/api/v1/marketing/campaigns/:id/send', marketingController.sendCampaign);
app.delete('/api/v1/marketing/campaigns/:id', marketingController.deleteCampaign);
// Rutas API REST v1 - Módulo de Inventario: Materias Primas
app.get('/api/v1/raw-materials', rawMaterialController.getAll);
app.post('/api/v1/raw-materials', rawMaterialController.create);
app.put('/api/v1/raw-materials/:id', rawMaterialController.update);
app.patch('/api/v1/raw-materials/:id/stock', rawMaterialController.updateStock);
// Rutas API REST v1 - Módulo de Inventario: Materiales de Empaque y Etiquetas
app.get('/api/v1/packaging-materials', packagingController.getAll);
app.post('/api/v1/packaging-materials', packagingController.create);
app.put('/api/v1/packaging-materials/:id', packagingController.update);
app.patch('/api/v1/packaging-materials/:id/stock', packagingController.updateStock);
// Rutas API REST v1 - Módulo de Clasificación: Familias y Sub-Familias de Artículos
app.get('/api/v1/article-families', articleFamilyController.getAll);
app.get('/api/v1/article-families/scope/:scope', articleFamilyController.getByScope);
app.get('/api/v1/article-families/:id', articleFamilyController.getById);
app.post('/api/v1/article-families', articleFamilyController.create);
app.put('/api/v1/article-families/:id', articleFamilyController.update);
app.delete('/api/v1/article-families/:id', articleFamilyController.delete);
// Rutas API REST v1 - Módulo de Inventario: Productos Finales
app.get('/api/v1/final-products', finalProductController.getAll);
app.post('/api/v1/final-products', finalProductController.create);
app.put('/api/v1/final-products/:id', finalProductController.update);
app.patch('/api/v1/final-products/:id/stock', finalProductController.updateStock);
// Rutas API REST v1 - Módulo de Fraccionado
app.post('/api/v1/fractioning/preview', fractioningController.preview);
app.post('/api/v1/fractioning/execute', fractioningController.execute);
app.get('/api/v1/fractioning/history', fractioningController.getHistory);
// Rutas API REST v1 - Módulo de Etiquetas
app.post('/api/v1/labels/product', labelPrintingController.printProductLabel);
app.post('/api/v1/labels/shipping', labelPrintingController.printShippingLabel);
// Rutas API REST v1 - Módulo de Reportes y KPIs
app.get('/api/v1/reports/kpis', reportsController.getExecutiveSummary);
app.get('/api/v1/reports/ticket-promedio', reportsController.getTicketPromedio);
app.get('/api/v1/reports/productos-estrella', reportsController.getStarProductsByDiet);
app.get('/api/v1/reports/tasa-recompra', reportsController.getRepurchaseRate);
app.get('/api/v1/reports/clientes-inactivos', reportsController.getInactiveCustomers);
app.get('/api/v1/reports/arqueo-caja', reportsController.getDailyCashAudit);
app.post('/api/v1/reports/arqueo-caja/cerrar', reportsController.closeCashShift);
app.get('/api/v1/reports/cuentas-corrientes', reportsController.getCurrentAccountsBalance);
// Rutas API REST v1 - Módulo de Fidelización de Clientes
app.post('/api/v1/customers/:id/points/accumulate', fidelizationController.accumulate);
app.post('/api/v1/customers/:id/points/redeem', fidelizationController.redeem);
app.post('/api/v1/customers/:id/points/adjust', fidelizationController.adjust);
app.get('/api/v1/customers/:id/points/history', fidelizationController.getHistory);
app.get('/api/v1/customers/:id/points/summary', fidelizationController.getSummary);
// Rutas API REST v1 - Módulo de Automatizaciones
app.post('/api/v1/automations/welcome', automationController.sendWelcome);
app.post('/api/v1/automations/birthday/process', automationController.processBirthday);
app.post('/api/v1/automations/replenishment/process', automationController.processReplenishment);
app.post('/api/v1/automations/broadcast/dietary', automationController.broadcastDietary);
app.get('/api/v1/automations/logs', automationController.getLogs);
// Endpoint de prueba de conexión e información del sistema
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'Flor y Ser Almacén Natural ERP/CRM v2.0',
        timestamp: new Date().toISOString(),
        modules: [
            'CRM & Clientes',
            'Etiquetas NIIMBOT B1 Pro',
            'Ventas y Cobros',
            'Cuentas Corrientes Clientes',
            'Presupuestos (Conversión 1-Clic)',
            'Proveedores, Recepción Granel/Elaborados y Cuentas por Pagar',
            'Finanzas, Gastos Operativos y Estructura de Precios & Costos por Canal',
            'Módulo de Tareas Operativas & Kanban (Operativo y Ventas)',
            'Configuración del Sistema y Parámetros',
            'WhatsApp Marketing, Plantillas y Campañas Masivas Segmentadas'
        ]
    });
});
// Fallback para SPA / index.html
app.get('*', (req, res) => {
    const distIndex = path_1.default.join(__dirname, '../frontend/dist/index.html');
    const publicIndex = path_1.default.join(__dirname, '../public/index.html');
    res.sendFile(fs_1.default.existsSync(distIndex) ? distIndex : publicIndex);
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Sistema Flor y Ser Almacén Natural v2.0 ejecutándose en http://localhost:${PORT}`);
    console.log(`📱 Acceso local desde Tablet en la red Wi-Fi: http://192.168.1.36:${PORT}`);
});
exports.default = app;
