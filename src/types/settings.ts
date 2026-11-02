/**
 * Tipos e interfaces para la Configuración del Sistema Flor y Ser Almacén Natural
 */

/**
 * Información comercial y fiscal del negocio
 */
export interface BusinessInfo {
  name: string;
  cuit: string;
  whatsapp: string;
  address: string;
  logoUrl?: string;
}

/**
 * Configuración de impresión térmica de etiquetas y comprobantes
 */
export interface PrintSettings {
  defaultPrinter: string;
  dpi: number;
}

/**
 * Comisiones por canal de venta y medios de pago (%)
 */
export interface ChannelCommissions {
  mostrador: number;
  whatsapp: number;
  tiendaOnline: number;
  mercadoPago: number;
  tarjetas: number;
}

/**
 * Parámetros globales para la Estructura de Precios y Costos
 */
export interface PricingParameters {
  /** % Global de Costo Fijo aplicado sobre el Costo Producto (Compra + Envase) */
  fixedCostPercentage: number;
  /** Opción C: Valor Hora de Mano de Obra ($/hora) */
  laborHourlyRate: number;
  /** Opción C: Horas promedio por lote procesado */
  defaultBatchHours: number;
  /** Opción C: Unidades promedio obtenidas por lote procesado */
  defaultBatchUnits: number;
  /** % de incidencia de Mano de Obra sobre el Costo Producto */
  laborCostPercentage: number;
  /** Si se aplica Mano de Obra a productos de Reventa Directa (por defecto false = 0%) */
  applyLaborToResale: boolean;
  /** % de Impuestos sobre Venta fijado desde el panel */
  taxPercentage: number;
  /** Múltiplo de redondeo del precio final (1, 10, 50, 100, 500, 1000) */
  roundingMultiple: number;
  /** Dirección de redondeo: 'UP' (hacia arriba) o 'NEAREST' (al más cercano) */
  roundingMode: 'UP' | 'NEAREST';
  /** Márgenes sugeridos por defecto por canal (%) */
  defaultMostradorMarginPct: number;
  defaultWhatsappMarginPct: number;
  defaultOnlineMarginPct: number;
}

/**
 * Estructura completa de Configuración del Sistema
 */
export interface SystemSettings {
  businessInfo: BusinessInfo;
  printSettings: PrintSettings;
  channelCommissions: ChannelCommissions;
  pricingParameters?: PricingParameters;
  helpSettings?: Record<string, any>;
  updatedAt?: string;
}

/**
 * DTO para actualizar la información comercial
 */
export interface UpdateBusinessInfoDTO {
  name?: string;
  cuit?: string;
  whatsapp?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * DTO para actualizar la configuración de impresión
 */
export interface UpdatePrintSettingsDTO {
  defaultPrinter?: string;
  dpi?: number;
}

/**
 * DTO para actualizar las comisiones por canal
 */
export interface UpdateChannelCommissionsDTO {
  mostrador?: number;
  whatsapp?: number;
  tiendaOnline?: number;
  mercadoPago?: number;
  tarjetas?: number;
}

/**
 * DTO para actualizar los parámetros globales de precios y costos
 */
export type UpdatePricingParametersDTO = Partial<PricingParameters>;

/**
 * DTO para actualizar parcialmente la configuración global
 */
export interface UpdateSystemSettingsDTO {
  businessInfo?: UpdateBusinessInfoDTO;
  printSettings?: UpdatePrintSettingsDTO;
  channelCommissions?: UpdateChannelCommissionsDTO;
  pricingParameters?: UpdatePricingParametersDTO;
  helpSettings?: Record<string, any>;
}
