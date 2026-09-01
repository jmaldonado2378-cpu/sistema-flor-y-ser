import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createDatabasePool } from './database';
import { requireAuth, requireRole } from './middleware/auth';

import { CustomerService } from './services/customerService';
import { CustomerController } from './controllers/customerController';

import { DietaryService } from './services/dietaryService';
import { DietaryController } from './controllers/dietaryController';

import { CheckingAccountService } from './services/checkingAccountService';
import { CheckingAccountController } from './controllers/checkingAccountController';

import { PaymentService } from './services/paymentService';
import { PaymentController } from './controllers/paymentController';

import { SaleService } from './services/saleService';
import { SaleController } from './controllers/saleController';

import { QuoteService } from './services/quoteService';
import { QuoteController } from './controllers/quoteController';

import { SupplierService } from './services/supplierService';
import { SupplierController } from './controllers/supplierController';

import { TaskService } from './services/taskService';
import { TaskController } from './controllers/taskController';

import { FinanceService } from './services/financeService';
import { FinanceController } from './controllers/financeController';

import { SettingsService } from './services/settingsService';
import { SettingsController } from './controllers/settingsController';

import { MarketingService } from './services/marketingService';
import { MarketingController } from './controllers/marketingController';

import { RawMaterialService } from './services/rawMaterialService';
import { RawMaterialController } from './controllers/rawMaterialController';

import { PackagingService } from './services/packagingService';
import { PackagingController } from './controllers/packagingController';

import { ArticleFamilyService } from './services/articleFamilyService';
import { ArticleFamilyController } from './controllers/articleFamilyController';

import { FinalProductService } from './services/finalProductService';
import { FinalProductController } from './controllers/finalProductController';

import { FractioningService } from './services/fractioningService';
import { FractioningController } from './controllers/fractioningController';

import { LabelPrintingService } from './services/labelPrintingService';
import { LabelPrintingController } from './controllers/labelPrintingController';

import { ReportsService } from './services/reportsService';
import { ReportsController } from './controllers/reportsController';

import { FidelizationService } from './services/fidelizationService';
import { FidelizationController } from './controllers/fidelizationController';

import { AutomationService } from './services/automationService';
import { AutomationController } from './controllers/automationController';

import { AuthService } from './services/authService';
import { AuthController } from './controllers/authController';

import { SystemService } from './services/systemService';
import { SystemController } from './controllers/systemController';

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Configuración de MySQL Pool via adapter compatible con pg.Pool interface
const db = createDatabasePool();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos del frontend (React SPA dist, raíz o public)
const frontendDist = path.join(__dirname, '../frontend/dist');
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(__dirname, '../public');

const staticDir = fs.existsSync(frontendDist)
  ? frontendDist
  : (fs.existsSync(path.join(rootDir, 'assets')) ? rootDir : publicDir);

app.use(express.static(staticDir));

// Inicialización de Servicios y Controladores Módulo 1 & 2
const customerService = new CustomerService(db);
const customerController = new CustomerController(customerService);

const dietaryService = new DietaryService(db);
const dietaryController = new DietaryController(dietaryService);

// Inicialización de Servicios y Controladores Módulo 3
const checkingAccountService = new CheckingAccountService(db);
const checkingAccountController = new CheckingAccountController(checkingAccountService);

const paymentService = new PaymentService(db, checkingAccountService);
const paymentController = new PaymentController(paymentService);

const saleService = new SaleService(db, paymentService, customerService);
const saleController = new SaleController(saleService);

const quoteService = new QuoteService(db, saleService);
const quoteController = new QuoteController(quoteService);

// Inicialización de Servicios y Controladores Módulo 4: Proveedores, Mercadería y Cuentas por Pagar
const supplierService = new SupplierService(db);
const supplierController = new SupplierController(supplierService);

// Inicialización Módulo Tareas Operativas & Kanban
const taskService = new TaskService(db, saleService);
const taskController = new TaskController(taskService);

// Inicialización Módulo Finanzas, Gastos y Estructura de Precios & Costos
const financeService = new FinanceService(db);
const financeController = new FinanceController(financeService);

// Inicialización Módulo Configuración del Sistema
const settingsService = new SettingsService(db);
const settingsController = new SettingsController(settingsService);

// Inicialización Módulo WhatsApp Marketing
const marketingService = new MarketingService(db, customerService);
const marketingController = new MarketingController(marketingService);

// Inicialización Módulo Inventario: Materias Primas, Empaques y Productos Finales
const rawMaterialService = new RawMaterialService(db);
const rawMaterialController = new RawMaterialController(rawMaterialService);

const packagingService = new PackagingService(db);
const packagingController = new PackagingController(packagingService);

const articleFamilyService = new ArticleFamilyService(db);
const articleFamilyController = new ArticleFamilyController(articleFamilyService);

const finalProductService = new FinalProductService(db);
const finalProductController = new FinalProductController(finalProductService);

// Inicialización Módulo Fraccionado
const fractioningService = new FractioningService(db, rawMaterialService, finalProductService, taskService);
const fractioningController = new FractioningController(fractioningService);
taskService.setFractioningService(fractioningService);

// Inicialización Módulo Etiquetas
const labelPrintingService = new LabelPrintingService();
const labelPrintingController = new LabelPrintingController(labelPrintingService);

// Inicialización Módulo Reportes y KPIs
const reportsService = new ReportsService(db);
const reportsController = new ReportsController(reportsService);

// Inicialización Módulo Fidelización de Clientes
const fidelizationService = new FidelizationService(db, customerService);
const fidelizationController = new FidelizationController(fidelizationService);

// Inicialización Módulo Automatizaciones WhatsApp
const automationService = new AutomationService(db, customerService);
const automationController = new AutomationController(automationService);

// Inicialización Módulo Autenticación & Usuarios
const authService = new AuthService(db);
const authController = new AuthController(authService);

// Inicialización Módulo Diagnóstico de Sistema & Mantenimiento
const systemService = new SystemService(db);
const systemController = new SystemController(systemService);

// =============================================
// RUTAS PÚBLICAS (sin autenticación)
// =============================================

// Autenticación
app.post('/api/v1/auth/login', authController.login);

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
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
app.get('/api/v1/auth/users', requireAuth, requireRole('ADMIN'), authController.getUsers);
app.post('/api/v1/auth/users', requireAuth, requireRole('ADMIN'), authController.createUser);
app.put('/api/v1/auth/users/:id', requireAuth, requireRole('ADMIN'), authController.updateUser);
app.delete('/api/v1/auth/users/:id', requireAuth, requireRole('ADMIN'), authController.deleteUser);

// Rutas API REST v1 - CRM & Clientes
app.get('/api/v1/customers', requireAuth, customerController.getAll);
app.post('/api/v1/customers', requireAuth, customerController.create);
app.get('/api/v1/customers/:id', requireAuth, customerController.getUnifiedProfile);
app.get('/api/v1/customers/:id/unified-profile', requireAuth, customerController.getUnifiedProfile);
app.put('/api/v1/customers/:id', requireAuth, customerController.update);
app.delete('/api/v1/customers/:id', requireAuth, requireRole('ADMIN'), customerController.delete);
app.get('/api/v1/dietary-profiles', requireAuth, dietaryController.getAll);
app.post('/api/v1/dietary-profiles', requireAuth, dietaryController.create);

// Rutas API REST v1 - Módulo 3: Ventas, Cobros, Cuentas Corrientes y Presupuestos
app.post('/api/v1/sales/orders', requireAuth, saleController.create);
app.get('/api/v1/sales/orders', requireAuth, saleController.getAll);
app.get('/api/v1/sales/orders/:id', requireAuth, saleController.getById);
app.patch('/api/v1/sales/orders/:id/status', requireAuth, saleController.updateStatus);

app.post('/api/v1/sales/payments', requireAuth, paymentController.register);
app.get('/api/v1/sales/payments/:id', requireAuth, paymentController.getById);
app.get('/api/v1/sales/customers/:customerId/payments', requireAuth, paymentController.getByCustomer);
app.get('/api/v1/sales/orders/:orderId/payments', requireAuth, paymentController.getByOrder);

app.get('/api/v1/sales/checking-accounts', requireAuth, checkingAccountController.getAllAccounts);
app.get('/api/v1/sales/customers/:customerId/checking-account', requireAuth, checkingAccountController.getSummary);
app.get('/api/v1/sales/customers/:customerId/checking-account/statement', requireAuth, checkingAccountController.getStatement);
app.post('/api/v1/sales/customers/:customerId/checking-account/collections', requireAuth, checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/payments', requireAuth, checkingAccountController.registerCollection);
app.post('/api/v1/sales/customers/:customerId/checking-account/adjustments', requireAuth, checkingAccountController.addManualAdjustment);
app.patch('/api/v1/sales/customers/:customerId/checking-account/credit-limit', requireAuth, requireRole('ADMIN'), checkingAccountController.updateCreditLimit);

app.post('/api/v1/sales/quotes', requireAuth, quoteController.create);
app.get('/api/v1/sales/quotes', requireAuth, quoteController.getAll);
app.get('/api/v1/sales/quotes/:id', requireAuth, quoteController.getById);
app.patch('/api/v1/sales/quotes/:id', requireAuth, quoteController.update);
app.post('/api/v1/sales/quotes/:id/convert-to-order', requireAuth, quoteController.convertToOrder);

// Rutas API REST v1 - Módulo 4: Proveedores, Recepción de Mercadería y Cuentas por Pagar
app.post('/api/v1/suppliers', requireAuth, supplierController.createSupplier);
app.get('/api/v1/suppliers', requireAuth, supplierController.searchSuppliers);
app.get('/api/v1/suppliers/:id', requireAuth, supplierController.getSupplierById);
app.put('/api/v1/suppliers/:id', requireAuth, supplierController.updateSupplier);
app.delete('/api/v1/suppliers/:id', requireAuth, requireRole('ADMIN'), supplierController.deleteSupplier);

app.post('/api/v1/merchandise-receipts', requireAuth, supplierController.createMerchandiseReceipt);
app.post('/api/v1/merchandise-receipts/raw', requireAuth, supplierController.createRawMaterialReceipt);
app.get('/api/v1/merchandise-receipts', requireAuth, supplierController.searchMerchandiseReceipts);
app.get('/api/v1/merchandise-receipts/:id', requireAuth, supplierController.getMerchandiseReceiptById);

app.post('/api/v1/accounts-payable/payments', requireAuth, supplierController.registerPayment);
app.get('/api/v1/accounts-payable/receipts/:id/payments', requireAuth, supplierController.getPaymentsByReceipt);
app.get('/api/v1/accounts-payable/calendar', requireAuth, supplierController.getAccountsPayableCalendar);

// Gastos Operativos
app.get('/api/v1/finance/expenses', requireAuth, financeController.getExpenses);
app.get('/api/v1/finance/expenses/summary', requireAuth, financeController.getExpenseSummary);
app.post('/api/v1/finance/expenses', requireAuth, financeController.createExpense);
app.put('/api/v1/finance/expenses/:id', requireAuth, financeController.updateExpense);
app.delete('/api/v1/finance/expenses/:id', requireAuth, requireRole('ADMIN'), financeController.deleteExpense);

// Estructura de Precios y Costos por Canal
app.get('/api/v1/finance/pricing-structure', requireAuth, financeController.getAllPricingStructures);
app.get('/api/v1/finance/pricing-structure/overview', requireAuth, financeController.getFinancialOverview);
app.get('/api/v1/finance/pricing-structure/:productId', requireAuth, financeController.getPricingStructureByProductId);
app.post('/api/v1/finance/pricing-structure/calculate-preview', requireAuth, financeController.calculatePreview);
app.post('/api/v1/finance/pricing-structure', requireAuth, financeController.savePricingStructure);
app.post('/api/v1/finance/pricing-structure/allocate-fixed-costs', requireAuth, requireRole('ADMIN'), financeController.allocateFixedCosts);

// Comisiones de Vendedores & Tablero Monitor de Ganancias (P&L Real-Time)
app.get('/api/v1/finance/commissions/rates/:userId', requireAuth, financeController.getSellerCommissionRates);
app.put('/api/v1/finance/commissions/rates/:userId', requireAuth, requireRole('ADMIN'), financeController.setSellerCommissionRate);
app.get('/api/v1/finance/commissions/pending', requireAuth, financeController.getPendingCommissions);
app.post('/api/v1/finance/commissions/settle', requireAuth, requireRole('ADMIN'), financeController.settleCommissions);
app.get('/api/v1/finance/commissions/settlements', requireAuth, financeController.getCommissionSettlements);
app.get('/api/v1/finance/profitability-monitor', requireAuth, financeController.getProfitabilityMonitor);

// Tareas Operativas & Tableros Kanban
app.post('/api/v1/tasks', requireAuth, taskController.create);
app.get('/api/v1/tasks', requireAuth, taskController.getAll);
app.get('/api/v1/tasks/kanban/board', requireAuth, taskController.getKanbanBoard);
app.get('/api/v1/tasks/sales-kanban/board', requireAuth, taskController.getSalesKanbanBoard);
app.get('/api/v1/tasks/:id', requireAuth, taskController.getById);
app.put('/api/v1/tasks/:id', requireAuth, taskController.update);
app.patch('/api/v1/tasks/:id/status', requireAuth, taskController.updateStatus);
app.delete('/api/v1/tasks/:id', requireAuth, requireRole('ADMIN'), taskController.delete);

// Configuración del Sistema
app.get('/api/v1/settings', requireAuth, settingsController.getSettings);
app.put('/api/v1/settings', requireAuth, requireRole('ADMIN'), settingsController.updateSettings);
app.patch('/api/v1/settings/business-info', requireAuth, requireRole('ADMIN'), settingsController.updateBusinessInfo);
app.patch('/api/v1/settings/print', requireAuth, requireRole('ADMIN'), settingsController.updatePrintSettings);
app.patch('/api/v1/settings/commissions', requireAuth, requireRole('ADMIN'), settingsController.updateChannelCommissions);

// WhatsApp Marketing (Plantillas & Campañas)
app.get('/api/v1/marketing/templates', requireAuth, marketingController.getTemplates);
app.get('/api/v1/marketing/templates/:id', requireAuth, marketingController.getTemplateById);
app.post('/api/v1/marketing/templates', requireAuth, marketingController.createTemplate);
app.put('/api/v1/marketing/templates/:id', requireAuth, marketingController.updateTemplate);
app.delete('/api/v1/marketing/templates/:id', requireAuth, marketingController.deleteTemplate);

app.get('/api/v1/marketing/campaigns', requireAuth, marketingController.getCampaigns);
app.get('/api/v1/marketing/campaigns/:id', requireAuth, marketingController.getCampaignById);
app.post('/api/v1/marketing/campaigns', requireAuth, marketingController.createCampaign);
app.put('/api/v1/marketing/campaigns/:id', requireAuth, marketingController.updateCampaign);
app.post('/api/v1/marketing/campaigns/audience-preview', requireAuth, marketingController.previewAudience);
app.post('/api/v1/marketing/campaigns/:id/send', requireAuth, marketingController.sendCampaign);
app.delete('/api/v1/marketing/campaigns/:id', requireAuth, marketingController.deleteCampaign);

// Diagnóstico de Sistema & Purga de Datos Semilla
app.get('/api/v1/system/db-status', requireAuth, systemController.getDbStatus);
app.post('/api/v1/system/purge-seed-data', requireAuth, requireRole('ADMIN'), systemController.purgeSeedData);

// Módulo de Inventario: Materias Primas
app.get('/api/v1/raw-materials', requireAuth, rawMaterialController.getAll);
app.post('/api/v1/raw-materials', requireAuth, rawMaterialController.create);
app.post('/api/v1/raw-materials/bulk-import', requireAuth, rawMaterialController.bulkImport);
app.delete('/api/v1/raw-materials/purge', requireAuth, requireRole('ADMIN'), rawMaterialController.purgeAll);
app.put('/api/v1/raw-materials/:id', requireAuth, rawMaterialController.update);
app.patch('/api/v1/raw-materials/:id/stock', requireAuth, rawMaterialController.updateStock);

// Módulo de Inventario: Materiales de Empaque y Etiquetas
app.get('/api/v1/packaging-materials', requireAuth, packagingController.getAll);
app.post('/api/v1/packaging-materials', requireAuth, packagingController.create);
app.put('/api/v1/packaging-materials/:id', requireAuth, packagingController.update);
app.patch('/api/v1/packaging-materials/:id/stock', requireAuth, packagingController.updateStock);

// Módulo de Clasificación: Familias y Sub-Familias de Artículos
app.get('/api/v1/article-families', requireAuth, articleFamilyController.getAll);
app.get('/api/v1/article-families/scope/:scope', requireAuth, articleFamilyController.getByScope);
app.get('/api/v1/article-families/:id', requireAuth, articleFamilyController.getById);
app.post('/api/v1/article-families', requireAuth, articleFamilyController.create);
app.put('/api/v1/article-families/:id', requireAuth, articleFamilyController.update);
app.delete('/api/v1/article-families/:id', requireAuth, requireRole('ADMIN'), articleFamilyController.delete);

// Módulo de Inventario: Productos Finales
app.get('/api/v1/final-products', requireAuth, finalProductController.getAll);
app.post('/api/v1/final-products', requireAuth, finalProductController.create);
app.post('/api/v1/final-products/bulk-import', requireAuth, finalProductController.bulkImport);
app.delete('/api/v1/final-products/purge', requireAuth, requireRole('ADMIN'), finalProductController.purgeAll);
app.put('/api/v1/final-products/:id', requireAuth, finalProductController.update);
app.patch('/api/v1/final-products/:id/stock', requireAuth, finalProductController.updateStock);

// Módulo de Fraccionado
app.post('/api/v1/fractioning/preview', requireAuth, fractioningController.preview);
app.post('/api/v1/fractioning/execute', requireAuth, fractioningController.execute);
app.get('/api/v1/fractioning/history', requireAuth, fractioningController.getHistory);

// Módulo de Etiquetas
app.post('/api/v1/labels/product', requireAuth, labelPrintingController.printProductLabel);
app.post('/api/v1/labels/shipping', requireAuth, labelPrintingController.printShippingLabel);

// Módulo de Reportes y KPIs
app.get('/api/v1/reports/kpis', requireAuth, reportsController.getExecutiveSummary);
app.get('/api/v1/reports/ticket-promedio', requireAuth, reportsController.getTicketPromedio);
app.get('/api/v1/reports/productos-estrella', requireAuth, reportsController.getStarProductsByDiet);
app.get('/api/v1/reports/tasa-recompra', requireAuth, reportsController.getRepurchaseRate);
app.get('/api/v1/reports/clientes-inactivos', requireAuth, reportsController.getInactiveCustomers);
app.get('/api/v1/reports/arqueo-caja', requireAuth, reportsController.getDailyCashAudit);
app.post('/api/v1/reports/arqueo-caja/cerrar', requireAuth, requireRole('ADMIN'), reportsController.closeCashShift);
app.get('/api/v1/reports/cuentas-corrientes', requireAuth, reportsController.getCurrentAccountsBalance);

// Módulo de Fidelización de Clientes
app.post('/api/v1/customers/:id/points/accumulate', requireAuth, fidelizationController.accumulate);
app.post('/api/v1/customers/:id/points/redeem', requireAuth, fidelizationController.redeem);
app.post('/api/v1/customers/:id/points/adjust', requireAuth, requireRole('ADMIN'), fidelizationController.adjust);
app.get('/api/v1/customers/:id/points/history', requireAuth, fidelizationController.getHistory);
app.get('/api/v1/customers/:id/points/summary', requireAuth, fidelizationController.getSummary);

// Módulo de Automatizaciones
app.post('/api/v1/automations/welcome', requireAuth, automationController.sendWelcome);
app.post('/api/v1/automations/birthday/process', requireAuth, automationController.processBirthday);
app.post('/api/v1/automations/replenishment/process', requireAuth, automationController.processReplenishment);
app.post('/api/v1/automations/broadcast/dietary', requireAuth, automationController.broadcastDietary);
app.get('/api/v1/automations/logs', requireAuth, automationController.getLogs);

// Fallback para SPA / index.html
app.get('*', (req: Request, res: Response) => {
  const distIndex = path.join(__dirname, '../frontend/dist/index.html');
  const rootIndex = path.join(__dirname, '../index.html');
  const publicIndex = path.join(__dirname, '../public/index.html');

  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.sendFile(publicIndex);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Sistema Flor y Ser Almacén Natural v2.0 ejecutándose en http://localhost:${PORT}`);
  console.log(`🔐 Autenticación JWT activa`);
  console.log(`🗄️  Base de datos: MySQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'})`);
});

export default app;
