import { AcquisitionChannel } from './customer';

export type SalesKanbanStatus =
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'READY_FOR_DELIVERY'
  | 'IN_DELIVERY'
  | 'DELIVERED';

export type OrderStatus =
  | SalesKanbanStatus
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethodEnum = 'CASH' | 'MERCADO_PAGO' | 'TRANSFER' | 'CURRENT_ACCOUNT_CREDIT';
export type AccountMovementType = 'DEBIT' | 'CREDIT';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'EXPIRED' | 'REJECTED';

// ==========================================
// 1. VENTAS Y PEDIDOS (SALES / ORDERS)
// ==========================================

export interface OrderItem {
  id?: string;
  orderId?: string;
  productName: string;
  productId?: string;
  isBulkFractioned: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface CreateOrderItemDTO {
  productName: string;
  productId?: string;
  isBulkFractioned?: boolean;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateOrderDTO {
  customerId: string;
  channel: AcquisitionChannel;
  quoteId?: string;
  items: CreateOrderItemDTO[];
  discountAmount?: number;
  deliveryFee?: number;
  sellerId?: string;
  sellerName?: string;
  deliveryAddress?: string;
  notes?: string;
  initialPayment?: {
    paymentMethod: PaymentMethodEnum;
    amount: number;
    referenceNumber?: string;
    notes?: string;
  };
}

export interface UpdateOrderStatusDTO {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface OrderFilterDTO {
  customerId?: string;
  sellerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  sellerId?: string;
  sellerName?: string;
  quoteId?: string;
  channel: AcquisitionChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  pointsEarned: number;
  commissionAmount?: number;
  commissionSettled?: boolean;
  commissionSettlementId?: string;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. COBROS (PAYMENTS / COLLECTIONS)
// ==========================================

export interface Payment {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  orderNumber?: string;
  paymentMethod: PaymentMethodEnum;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentDTO {
  customerId: string;
  orderId?: string;
  paymentMethod: PaymentMethodEnum;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

// ==========================================
// 3. CUENTAS CORRIENTES (CHECKING ACCOUNTS)
// ==========================================

export interface CustomerAccountMovement {
  id: string;
  customerId: string;
  movementType: AccountMovementType;
  amount: number;
  balanceAfter: number;
  referenceType: 'ORDER' | 'PAYMENT' | 'MANUAL_ADJUSTMENT';
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface CheckingAccountSummary {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  creditLimit: number;
  currentBalance: number; // Saldo deudor positivo = debe dinero; negativo = saldo a favor
  balance?: number;
  availableCredit: number;
  lastMovementDate?: string;
}

export interface AccountStatementFilterDTO {
  customerId: string;
  startDate?: string;
  endDate?: string;
}

export interface AccountStatement {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  address?: string;
  creditLimit: number;
  periodStart: string;
  periodEnd: string;
  initialBalance: number;
  totalDebits: number;
  totalCredits: number;
  finalBalance: number;
  movements: CustomerAccountMovement[];
  formattedWhatsappSummary: string;
}

export interface CreateManualMovementDTO {
  customerId: string;
  movementType: AccountMovementType;
  amount: number;
  description: string;
}

export interface UpdateCreditLimitDTO {
  creditLimit: number;
}

// ==========================================
// 4. PRESUPUESTOS (QUOTES / BUDGETS)
// ==========================================

export interface QuoteItem {
  id?: string;
  quoteId?: string;
  productName: string;
  productId?: string;
  isBulkFractioned: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface CreateQuoteDTO {
  customerId: string;
  channel?: AcquisitionChannel;
  expirationDate: string; // YYYY-MM-DD
  items: CreateOrderItemDTO[];
  discountAmount?: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  notes?: string;
}

export interface UpdateQuoteDTO {
  expirationDate?: string;
  items?: CreateOrderItemDTO[];
  discountAmount?: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  notes?: string;
  status?: QuoteStatus;
}

export interface QuoteFilterDTO {
  customerId?: string;
  status?: QuoteStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName?: string;
  channel: AcquisitionChannel;
  status: QuoteStatus;
  expirationDate: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress?: string;
  notes?: string;
  convertedOrderId?: string;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ConvertQuoteToOrderDTO {
  initialPaymentMethod?: PaymentMethodEnum;
  initialPaymentAmount?: number;
  referenceNumber?: string;
  notes?: string;
}

// ==========================================
// 5. EXTRACTOS DETALLADOS Y REGISTRO DE COBROS A CUENTA DE CLIENTES
// ==========================================

/**
 * DTO para registrar un cobro a cuenta de cliente en su cuenta corriente
 */
export interface RegistrarCobroClienteDTO {
  clienteId: string;
  monto: number;
  metodoPago: PaymentMethodEnum | string; // CASH, MERCADO_PAGO, TRANSFER
  numeroComprobanteRef?: string;
  pedidoId?: string;
  notas?: string;
}

/**
 * Recibo de cobro emitido tras registrar un pago a cuenta del cliente
 */
export interface ReciboCobroCliente {
  id: string;
  numeroRecibo: string;
  clienteId: string;
  nombreCliente: string;
  montoCobrado: number;
  metodoPago: string;
  numeroComprobanteRef?: string;
  pedidoId?: string;
  numeroPedido?: string;
  saldoAnterior: number;
  nuevoSaldoDeudor: number;
  creditoDisponible: number;
  fechaCobro: string;
  notas?: string;
}

/**
 * Detalle individual de movimiento para extractos detallados de cuenta corriente
 */
export interface DetalleMovimientoExtracto {
  id: string;
  clienteId: string;
  tipoMovimiento: AccountMovementType; // DEBIT o CREDIT
  monto: number;
  saldoPosterior: number;
  tipoReferencia: 'ORDER' | 'PAYMENT' | 'MANUAL_ADJUSTMENT';
  idReferencia?: string;
  numeroComprobante?: string;
  descripcion: string;
  metodoPago?: string;
  itemsPedido?: Array<{
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  fecha: string;
}

/**
 * Extracto detallado de Cuenta Corriente de Cliente con desglose financiero e ítems
 */
export interface ExtractoDetalladoCuentaCorriente {
  clienteId: string;
  nombreCliente: string;
  telefonoWhatsapp: string;
  email?: string;
  direccion?: string;
  limiteCredito: number;
  creditoDisponible: number;
  fechaInicio: string;
  fechaFin: string;
  saldoInicial: number;
  totalDebitos: number;
  totalCreditos: number;
  saldoFinalDeudor: number;
  movimientos: DetalleMovimientoExtracto[];
  resumenWhatsappFormateado: string;
}

/**
 * Filtro de búsqueda para generar un extracto detallado de cuenta corriente
 */
export interface FiltroExtractoDetalladoDTO {
  clienteId: string;
  fechaInicio?: string;
  fechaFin?: string;
  incluirDetalleItems?: boolean;
}

