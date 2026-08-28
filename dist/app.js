"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("./database");
const auth_1 = require("./middleware/auth");
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
// Configuración de MySQL Pool via adapter compatible con pg.Pool interface
const db = (0, database_1.createDatabasePool)();
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
// =============================================
// RUTAS PÚBLICAS (sin autenticación)
// =============================================
// Autenticación
app.post('/api/v1/auth/login', authController.login);
// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'Flor y Ser Almacén Natural ERP/CRM v2.0',
        database: 'MySQL (Hostinger)',
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
// =============================================
// RUTAS PROTEGIDAS (requieren JWT válido)
// =============================================
// Gestión de Usuarios (solo ADMIN)
app.get('/api/v1/auth/users', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), authController.getUsers);
app.post('/api/v1/auth/users', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), authController.createUser);
app.put('/api/v1/auth/users/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), authController.updateUser);
app.delete('/api/v1/auth/users/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), authController.deleteUser);
// Rutas API REST v1 - CRM & Clientes
app.get('/api/v1/customers', auth_1.requireAuth, customerController.getAll);
app.post('/api/v1/customers', auth_1.requireAuth, customerController.create);
app.get('/api/v1/customers/:id', auth_1.requireAuth, customerController.getUnifiedProfile);
app.get('/api/v1/customers/:id/unified-profile', auth_1.requireAuth, customerController.getUnifiedProfile);
app.put('/api/v1/customers/:id', auth_1.requireAuth, customerController.update);
app.delete('/api/v1/customers/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), customerController.delete);
app.get('/api/v1/dietary-profiles', auth_1.requireAuth, dietaryController.getAll);
app.post('/api/v1/dietary-profiles', auth_1.requireAuth, dietaryController.create);
// Rutas API REST v1 - Módulo 3: Ventas, Cobros, Cuentas Corrientes y Presupuestos
app.post('/api/v1/sales/orders', auth_1.requireAuth, saleController.create);
app.get('/api/v1/sales/orders', auth_1.requireAuth, saleController.getAll);
app.get('/api/v1/sales/orders/:id', auth_1.requireAuth, saleController.getById);
app.patch('/api/v1/sales/orders/:id/status', auth_1.requireAuth, saleController.updateStatus);
app.post('/api/v1/sales/payments', auth_1.requireAuth, paymentController.register);
app.get('/api/v1/sales/payments/:id', auth_1.requireAuth, paymentController.getById);
app.get('/api/v1/sales/customers/:customerId/payments', auth_1.requireAuth, paymentController.getByCustomer);
app.get('/api/v1/sales/orders/:orderId/payments', auth_1.requireAuth, paymentController.getByOrder);
app.get('/api/v1/sales/checking-accounts', auth_1.requireAuth, checkingAccountController.getAllAccounts);
app.get('/api/v1/sales/customers/:customerId/checking-account', auth_1.requireAuth, checkingAccountController.getSummary);
app.get('/api/v1/sales/customers/:customerId/checking-account/statement', auth_1.requireAuth, checkingAccountController.getStatement);
app.post('/api/v1/sales/customers/:customerId/checking-account/collections', auth_1.requireAuth, checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/payments', auth_1.requireAuth, checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/adjustments', auth_1.requireAuth, checkingAccountController.addManualAdjustment);
app.patch('/api/v1/sales/customers/:customerId/checking-account/credit-limit', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), checkingAccountController.updateCreditLimit);
app.post('/api/v1/sales/quotes', auth_1.requireAuth, quoteController.create);
app.get('/api/v1/sales/quotes', auth_1.requireAuth, quoteController.getAll);
app.get('/api/v1/sales/quotes/:id', auth_1.requireAuth, quoteController.getById);
app.patch('/api/v1/sales/quotes/:id', auth_1.requireAuth, quoteController.update);
app.post('/api/v1/sales/quotes/:id/convert-to-order', auth_1.requireAuth, quoteController.convertToOrder);
// Rutas API REST v1 - Módulo 4: Proveedores, Recepción de Mercadería y Cuentas por Pagar
app.post('/api/v1/suppliers', auth_1.requireAuth, supplierController.createSupplier);
app.get('/api/v1/suppliers', auth_1.requireAuth, supplierController.searchSuppliers);
app.get('/api/v1/suppliers/:id', auth_1.requireAuth, supplierController.getSupplierById);
app.put('/api/v1/suppliers/:id', auth_1.requireAuth, supplierController.updateSupplier);
app.delete('/api/v1/suppliers/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), supplierController.deleteSupplier);
app.post('/api/v1/merchandise-receipts', auth_1.requireAuth, supplierController.createMerchandiseReceipt);
app.post('/api/v1/merchandise-receipts/raw', auth_1.requireAuth, supplierController.createRawMaterialReceipt);
app.get('/api/v1/merchandise-receipts', auth_1.requireAuth, supplierController.searchMerchandiseReceipts);
app.get('/api/v1/merchandise-receipts/:id', auth_1.requireAuth, supplierController.getMerchandiseReceiptById);
app.post('/api/v1/accounts-payable/payments', auth_1.requireAuth, supplierController.registerPayment);
app.get('/api/v1/accounts-payable/receipts/:id/payments', auth_1.requireAuth, supplierController.getPaymentsByReceipt);
app.get('/api/v1/accounts-payable/calendar', auth_1.requireAuth, supplierController.getAccountsPayableCalendar);
// Gastos Operativos
app.get('/api/v1/finance/expenses', auth_1.requireAuth, financeController.getExpenses);
app.get('/api/v1/finance/expenses/summary', auth_1.requireAuth, financeController.getExpenseSummary);
app.post('/api/v1/finance/expenses', auth_1.requireAuth, financeController.createExpense);
app.put('/api/v1/finance/expenses/:id', auth_1.requireAuth, financeController.updateExpense);
app.delete('/api/v1/finance/expenses/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), financeController.deleteExpense);
// Estructura de Precios y Costos por Canal
app.get('/api/v1/finance/pricing-structure', auth_1.requireAuth, financeController.getAllPricingStructures);
app.get('/api/v1/finance/pricing-structure/overview', auth_1.requireAuth, financeController.getFinancialOverview);
app.get('/api/v1/finance/pricing-structure/:productId', auth_1.requireAuth, financeController.getPricingStructureByProductId);
app.post('/api/v1/finance/pricing-structure/calculate-preview', auth_1.requireAuth, financeController.calculatePreview);
app.post('/api/v1/finance/pricing-structure', auth_1.requireAuth, financeController.savePricingStructure);
app.post('/api/v1/finance/pricing-structure/allocate-fixed-costs', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), financeController.allocateFixedCosts);
// Comisiones de Vendedores & Tablero Monitor de Ganancias (P&L Real-Time)
app.get('/api/v1/finance/commissions/rates/:userId', auth_1.requireAuth, financeController.getSellerCommissionRates);
app.put('/api/v1/finance/commissions/rates/:userId', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), financeController.setSellerCommissionRate);
app.get('/api/v1/finance/commissions/pending', auth_1.requireAuth, financeController.getPendingCommissions);
app.post('/api/v1/finance/commissions/settle', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), financeController.settleCommissions);
app.get('/api/v1/finance/commissions/settlements', auth_1.requireAuth, financeController.getCommissionSettlements);
app.get('/api/v1/finance/profitability-monitor', auth_1.requireAuth, financeController.getProfitabilityMonitor);
// Tareas Operativas & Tableros Kanban
app.post('/api/v1/tasks', auth_1.requireAuth, taskController.create);
app.get('/api/v1/tasks', auth_1.requireAuth, taskController.getAll);
app.get('/api/v1/tasks/kanban/board', auth_1.requireAuth, taskController.getKanbanBoard);
app.get('/api/v1/tasks/sales-kanban/board', auth_1.requireAuth, taskController.getSalesKanbanBoard);
app.get('/api/v1/tasks/:id', auth_1.requireAuth, taskController.getById);
app.put('/api/v1/tasks/:id', auth_1.requireAuth, taskController.update);
app.patch('/api/v1/tasks/:id/status', auth_1.requireAuth, taskController.updateStatus);
app.delete('/api/v1/tasks/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), taskController.delete);
// Configuración del Sistema
app.get('/api/v1/settings', auth_1.requireAuth, settingsController.getSettings);
app.put('/api/v1/settings', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), settingsController.updateSettings);
app.patch('/api/v1/settings/business-info', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), settingsController.updateBusinessInfo);
app.patch('/api/v1/settings/print', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), settingsController.updatePrintSettings);
app.patch('/api/v1/settings/commissions', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), settingsController.updateChannelCommissions);
// WhatsApp Marketing (Plantillas & Campañas)
app.get('/api/v1/marketing/templates', auth_1.requireAuth, marketingController.getTemplates);
app.get('/api/v1/marketing/templates/:id', auth_1.requireAuth, marketingController.getTemplateById);
app.post('/api/v1/marketing/templates', auth_1.requireAuth, marketingController.createTemplate);
app.put('/api/v1/marketing/templates/:id', auth_1.requireAuth, marketingController.updateTemplate);
app.delete('/api/v1/marketing/templates/:id', auth_1.requireAuth, marketingController.deleteTemplate);
app.get('/api/v1/marketing/campaigns', auth_1.requireAuth, marketingController.getCampaigns);
app.get('/api/v1/marketing/campaigns/:id', auth_1.requireAuth, marketingController.getCampaignById);
app.post('/api/v1/marketing/campaigns', auth_1.requireAuth, marketingController.createCampaign);
app.put('/api/v1/marketing/campaigns/:id', auth_1.requireAuth, marketingController.updateCampaign);
app.post('/api/v1/marketing/campaigns/audience-preview', auth_1.requireAuth, marketingController.previewAudience);
app.post('/api/v1/marketing/campaigns/:id/send', auth_1.requireAuth, marketingController.sendCampaign);
app.delete('/api/v1/marketing/campaigns/:id', auth_1.requireAuth, marketingController.deleteCampaign);
// Módulo de Inventario: Materias Primas
app.get('/api/v1/raw-materials', auth_1.requireAuth, rawMaterialController.getAll);
app.post('/api/v1/raw-materials', auth_1.requireAuth, rawMaterialController.create);
app.put('/api/v1/raw-materials/:id', auth_1.requireAuth, rawMaterialController.update);
app.patch('/api/v1/raw-materials/:id/stock', auth_1.requireAuth, rawMaterialController.updateStock);
// Módulo de Inventario: Materiales de Empaque y Etiquetas
app.get('/api/v1/packaging-materials', auth_1.requireAuth, packagingController.getAll);
app.post('/api/v1/packaging-materials', auth_1.requireAuth, packagingController.create);
app.put('/api/v1/packaging-materials/:id', auth_1.requireAuth, packagingController.update);
app.patch('/api/v1/packaging-materials/:id/stock', auth_1.requireAuth, packagingController.updateStock);
// Módulo de Clasificación: Familias y Sub-Familias de Artículos
app.get('/api/v1/article-families', auth_1.requireAuth, articleFamilyController.getAll);
app.get('/api/v1/article-families/scope/:scope', auth_1.requireAuth, articleFamilyController.getByScope);
app.get('/api/v1/article-families/:id', auth_1.requireAuth, articleFamilyController.getById);
app.post('/api/v1/article-families', auth_1.requireAuth, articleFamilyController.create);
app.put('/api/v1/article-families/:id', auth_1.requireAuth, articleFamilyController.update);
app.delete('/api/v1/article-families/:id', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), articleFamilyController.delete);
// Módulo de Inventario: Productos Finales
app.get('/api/v1/final-products', auth_1.requireAuth, finalProductController.getAll);
app.post('/api/v1/final-products', auth_1.requireAuth, finalProductController.create);
app.put('/api/v1/final-products/:id', auth_1.requireAuth, finalProductController.update);
app.patch('/api/v1/final-products/:id/stock', auth_1.requireAuth, finalProductController.updateStock);
// Módulo de Fraccionado
app.post('/api/v1/fractioning/preview', auth_1.requireAuth, fractioningController.preview);
app.post('/api/v1/fractioning/execute', auth_1.requireAuth, fractioningController.execute);
app.get('/api/v1/fractioning/history', auth_1.requireAuth, fractioningController.getHistory);
// Módulo de Etiquetas
app.post('/api/v1/labels/product', auth_1.requireAuth, labelPrintingController.printProductLabel);
app.post('/api/v1/labels/shipping', auth_1.requireAuth, labelPrintingController.printShippingLabel);
// Módulo de Reportes y KPIs
app.get('/api/v1/reports/kpis', auth_1.requireAuth, reportsController.getExecutiveSummary);
app.get('/api/v1/reports/ticket-promedio', auth_1.requireAuth, reportsController.getTicketPromedio);
app.get('/api/v1/reports/productos-estrella', auth_1.requireAuth, reportsController.getStarProductsByDiet);
app.get('/api/v1/reports/tasa-recompra', auth_1.requireAuth, reportsController.getRepurchaseRate);
app.get('/api/v1/reports/clientes-inactivos', auth_1.requireAuth, reportsController.getInactiveCustomers);
app.get('/api/v1/reports/arqueo-caja', auth_1.requireAuth, reportsController.getDailyCashAudit);
app.post('/api/v1/reports/arqueo-caja/cerrar', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), reportsController.closeCashShift);
app.get('/api/v1/reports/cuentas-corrientes', auth_1.requireAuth, reportsController.getCurrentAccountsBalance);
// Módulo de Fidelización de Clientes
app.post('/api/v1/customers/:id/points/accumulate', auth_1.requireAuth, fidelizationController.accumulate);
app.post('/api/v1/customers/:id/points/redeem', auth_1.requireAuth, fidelizationController.redeem);
app.post('/api/v1/customers/:id/points/adjust', auth_1.requireAuth, (0, auth_1.requireRole)('ADMIN'), fidelizationController.adjust);
app.get('/api/v1/customers/:id/points/history', auth_1.requireAuth, fidelizationController.getHistory);
app.get('/api/v1/customers/:id/points/summary', auth_1.requireAuth, fidelizationController.getSummary);
// Módulo de Automatizaciones
app.post('/api/v1/automations/welcome', auth_1.requireAuth, automationController.sendWelcome);
app.post('/api/v1/automations/birthday/process', auth_1.requireAuth, automationController.processBirthday);
app.post('/api/v1/automations/replenishment/process', auth_1.requireAuth, automationController.processReplenishment);
app.post('/api/v1/automations/broadcast/dietary', auth_1.requireAuth, automationController.broadcastDietary);
app.get('/api/v1/automations/logs', auth_1.requireAuth, automationController.getLogs);
// Fallback para SPA / index.html
app.get('*', (req, res) => {
    const distIndex = path_1.default.join(__dirname, '../frontend/dist/index.html');
    const publicIndex = path_1.default.join(__dirname, '../public/index.html');
    res.sendFile(fs_1.default.existsSync(distIndex) ? distIndex : publicIndex);
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Sistema Flor y Ser Almacén Natural v2.0 ejecutándose en http://localhost:${PORT}`);
    console.log(`🔐 Autenticación JWT activa`);
    console.log(`🗄️  Base de datos: MySQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'})`);
});
exports.default = app;
