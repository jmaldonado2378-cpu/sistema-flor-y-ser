export enum MerchandiseType {
  GRANEL = 'GRANEL',       // Insumos / Materias primas a granel (kg, g, l, ml)
  ELABORADO = 'ELABORADO'  // Productos finales elaborados o empaquetados (unidades)
}

export enum SupplierPaymentStatus {
  PENDING = 'PENDING',  // Pendiente de pago
  PARTIAL = 'PARTIAL',  // Parcialmente pagado
  PAID = 'PAID',        // Pagado totalmente
  OVERDUE = 'OVERDUE'   // Vencido
}

export enum ReceiptType {
  FACTURA = 'FACTURA',
  REMITO = 'REMITO',
  NOTA_CREDITO = 'NOTA_CREDITO'
}

export enum SupplierPaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE',
  MERCADO_PAGO = 'MERCADO_PAGO',
  OTRO = 'OTRO'
}

/**
 * Ficha de Proveedor
 */
export interface Supplier {
  id: string;
  taxId: string;                // CUIT / RUT
  businessName: string;         // Razón Social / Nombre Comercial
  contactName?: string;         // Persona de contacto
  phone: string;                // Teléfono / WhatsApp
  email?: string;
  address?: string;
  categories: string[];         // Rubros provistos (e.g. Frutos Secos, Harinas Sin TACC)
  commercialTerms?: string;     // Ej: "30 días neto", "Contado contra entrega"
  deliveryDays?: string;        // Ej: "Lunes y Jueves"
  bankDetails?: string;         // CBU, Alias, Banco
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  taxId: string;
  businessName: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
  categories?: string[];
  commercialTerms?: string;
  deliveryDays?: string;
  bankDetails?: string;
  notes?: string;
}

export interface UpdateSupplierDTO {
  taxId?: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories?: string[];
  commercialTerms?: string;
  deliveryDays?: string;
  bankDetails?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SupplierFilterDTO {
  search?: string;
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Detalle de ítem recibido (Granel o Elaborado)
 */
export interface MerchandiseReceiptItemDTO {
  productId?: string;
  itemName: string;
  itemType: MerchandiseType;    // GRANEL o ELABORADO
  quantity: number;             // Ej: 25.5 (kg) o 100 (unidades)
  unitOfMeasure: string;        // 'kg', 'g', 'l', 'unidades'
  unitCost: number;             // Costo unitario
  lotNumber?: string;           // N° de Lote asignado
  expirationDate?: string;      // YYYY-MM-DD
}

export interface MerchandiseReceiptItem {
  id: string;
  receiptId: string;
  productId?: string;
  itemName: string;
  itemType: MerchandiseType;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  subtotal: number;
  lotNumber?: string;
  expirationDate?: string;
  createdAt: string;
}

/**
 * Recepción e Ingreso de Mercadería (Factura / Comprobante de Compra)
 */
export interface CreateMerchandiseReceiptDTO {
  receiptNumber: string;        // N° de factura o remito
  supplierId: string;
  receiptType?: ReceiptType;    // Defecto: FACTURA
  issueDate: string;            // YYYY-MM-DD
  receptionDate?: string;       // YYYY-MM-DD (Defecto: Hoy)
  dueDate?: string;             // YYYY-MM-DD (Calculado si se pasa paymentTermsDays)
  paymentTermsDays?: number;    // Ej: 30 días
  items: MerchandiseReceiptItemDTO[];
  notes?: string;
}

export interface MerchandiseReceipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  receiptType: ReceiptType;
  issueDate: string;
  receptionDate: string;
  dueDate: string;
  paymentTermsDays: number;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  paymentStatus: SupplierPaymentStatus;
  items: MerchandiseReceiptItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptFilterDTO {
  supplierId?: string;
  paymentStatus?: SupplierPaymentStatus;
  receiptType?: ReceiptType;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Registro de Pago a Proveedor (Cuentas por Pagar)
 */
export interface CreateSupplierPaymentDTO {
  receiptId: string;
  amount: number;
  paymentDate?: string;         // YYYY-MM-DD
  paymentMethod: SupplierPaymentMethod;
  referenceNumber?: string;     // Comprobante bancario / recibo / n° cheque
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  receiptId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: SupplierPaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Calendario de Vencimientos y Estado Financiero de Cuentas por Pagar
 */
export type UrgencyLevel = 'VENCIDO' | 'CRITICO' | 'PROXIMO' | 'REGULAR';

export interface AccountsPayableCalendarItem {
  receiptId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  issueDate: string;
  dueDate: string;
  daysRemainingOrOverdue: number; // Negativo = Días vencido, Positivo = Días para vencer
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  paymentStatus: SupplierPaymentStatus;
  urgency: UrgencyLevel;
}

export interface AccountsPayableCalendarSummary {
  totalOverdueAmount: number;             // Total vencido a la fecha
  totalDueNext7DaysAmount: number;         // Total a vencer en los próximos 7 días
  totalDueNext30DaysAmount: number;        // Total a vencer en los próximos 30 días
  totalGlobalAccountsPayable: number;      // Total pasivo con proveedores
  totalPendingReceiptsCount: number;       // Cantidad de facturas pendientes
  totalOverdueReceiptsCount: number;       // Cantidad de facturas vencidas
  bySupplierSummary: Array<{
    supplierId: string;
    supplierName: string;
    totalDebt: number;
    pendingReceiptsCount: number;
  }>;
}

export interface AccountsPayableFilterDTO {
  supplierId?: string;
  urgency?: UrgencyLevel;
  paymentStatus?: SupplierPaymentStatus;
  daysRange?: number; // Ej: 7, 30, 60 días
}

// =========================================================================
// RECEPCIÓN E INGRESO DE INSUMOS A GRANEL (POST /api/v1/merchandise-receipts/raw)
// =========================================================================

/**
 * Detalle de ítem de insumo a granel ingresado (materia prima por kg/litro)
 */
export interface ItemInsumoGranelDTO {
  materiaPrimaId?: string;       // ID de materia prima existente en raw_materials (opcional)
  codigoMateriaPrima?: string;   // Código identificador (ej. MP-ALM-01)
  nombreInsumo: string;          // Nombre del insumo a granel (ej. Almendras Peladas A Granel)
  unidadMedida: 'KG' | 'L' | 'G' | 'ML' | string; // kg, l, g, ml
  cantidadIngresada: number;     // Cantidad/Peso ingresado en kg o litros (ej. 50.0)
  costoPorKg: number;            // Costo por kg o por unidad de medida
  numeroLote?: string;           // N° de Lote de trazabilidad
  fechaVencimiento?: string;     // YYYY-MM-DD
  ubicacionDeposito?: string;    // Ubicación en depósito (ej. Depósito A - Estante 2)
}

/**
 * DTO para la creación de factura/comprobante de recepción de insumos a granel
 * POST /api/v1/merchandise-receipts/raw
 */
export interface CrearComprobanteInsumoGranelDTO {
  numeroComprobante: string;     // N° de Factura / Remito (ej. FC-A-0001-00045892)
  proveedorId: string;           // ID del proveedor
  tipoComprobante?: ReceiptType; // FACTURA, REMITO, NOTA_CREDITO
  fechaEmision: string;          // YYYY-MM-DD
  fechaRecepcion?: string;       // YYYY-MM-DD (Defecto: fecha actual)
  fechaVencimientoPago?: string; // YYYY-MM-DD (Calculado si no se envía)
  diasCreditoPago?: number;      // Ej. 30 días
  insumos: ItemInsumoGranelDTO[]; // Lista de insumos a granel recibidos
  notas?: string;
}

/**
 * Registro procesado de un ítem de insumo a granel en el comprobante
 */
export interface ItemComprobanteInsumoGranel {
  id: string;
  comprobanteId: string;
  materiaPrimaId: string;
  codigoMateriaPrima: string;
  nombreInsumo: string;
  unidadMedida: string;
  cantidadIngresada: number;
  costoPorKg: number;
  subtotal: number; // cantidadIngresada * costoPorKg
  stockAnterior: number;
  nuevoStockMateriaPrima: number;
  numeroLote?: string;
  fechaVencimiento?: string;
  creadoEn: string;
}

/**
 * Comprobante de Recepción de Insumos a Granel emitido con incremento de stock de materia prima y costo por kg
 */
export interface ComprobanteInsumoGranel {
  id: string;
  numeroComprobante: string;
  proveedorId: string;
  nombreProveedor: string;
  cuitProveedor: string;
  tipoComprobante: ReceiptType;
  fechaEmision: string;
  fechaRecepcion: string;
  fechaVencimientoPago: string;
  diasCreditoPago: number;
  montoTotalComprobante: number;
  montoAbonado: number;
  saldoPendientePago: number;
  estadoPago: SupplierPaymentStatus;
  items: ItemComprobanteInsumoGranel[];
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

