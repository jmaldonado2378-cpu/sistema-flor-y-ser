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
 * Estructura completa de Configuración del Sistema
 */
export interface SystemSettings {
  businessInfo: BusinessInfo;
  printSettings: PrintSettings;
  channelCommissions: ChannelCommissions;
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
 * DTO para actualizar parcialmente la configuración global
 */
export interface UpdateSystemSettingsDTO {
  businessInfo?: UpdateBusinessInfoDTO;
  printSettings?: UpdatePrintSettingsDTO;
  channelCommissions?: UpdateChannelCommissionsDTO;
}
