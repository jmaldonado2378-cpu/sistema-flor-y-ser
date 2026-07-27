import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';

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

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Configuración de PostgreSQL Pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flor_y_ser',
  idleTimeoutMillis: 30000,
});

app.use(cors());
app.use(express.json());

// Archivos estáticos del frontend responsivo
app.use(express.static(path.join(__dirname, '../public')));

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

const saleService = new SaleService(db, paymentService);
const saleController = new SaleController(saleService);

const quoteService = new QuoteService(db, saleService);
const quoteController = new QuoteController(quoteService);

// Inicialización de Servicios y Controladores Módulo 4: Proveedores, Mercadería y Cuentas por Pagar
const supplierService = new SupplierService(db);
const supplierController = new SupplierController(supplierService);

// Inicialización Módulo Tareas Operativas & Kanban
const taskService = new TaskService(db);
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

// Rutas API REST v1 - CRM & Clientes
app.post('/api/v1/customers', customerController.create);
app.get('/api/v1/customers/:id/unified-profile', customerController.getUnifiedProfile);
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

// Endpoint de prueba de conexión e información del sistema
app.get('/api/v1/health', (req: Request, res: Response) => {
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
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Sistema Flor y Ser Almacén Natural v2.0 ejecutándose en http://localhost:${PORT}`);
  console.log(`📱 Acceso local desde Tablet en la red Wi-Fi: http://192.168.1.36:${PORT}`);
});

export default app;
