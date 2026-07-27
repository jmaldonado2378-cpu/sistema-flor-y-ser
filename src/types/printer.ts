export enum PrinterConnectionType {
  BLUETOOTH = 'BLUETOOTH',
  USB = 'USB',
  WEBSOCKET_LOCAL = 'WEBSOCKET_LOCAL',
  NETWORK = 'NETWORK'
}

export enum PrinterProtocol {
  NIIMBOT_PRO = 'NIIMBOT_PRO',
  TSPL = 'TSPL',
  ESC_POS = 'ESC_POS',
  CPCL = 'CPCL'
}

export interface PrinterConfiguration {
  id: string;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  protocol: PrinterProtocol;
  labelWidthMm: number;
  labelHeightMm: number;
  dpi: number;
  macAddressOrIp?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface CreatePrinterConfigDTO {
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  protocol: PrinterProtocol;
  labelWidthMm: number;
  labelHeightMm: number;
  dpi?: number;
  macAddressOrIp?: string;
  isDefault?: boolean;
}

export interface ProductThermalLabelDTO {
  productName: string;
  brandName?: string;
  netWeightLabel: string; // ej: "500g", "250g", "1 kg"
  batchNumber: string;
  fractioningDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  barcode: string; // EAN-13 / CODE128
  ingredients?: string;
  dietaryBadges?: string[]; // ["VEGAN", "CELIAC", "ORGANIC"]
  copies?: number;
  widthMm?: number;
  heightMm?: number;
}

export interface ShippingLogisticsLabelDTO {
  orderNumber: string;
  customerName: string;
  customerPhoneWhatsapp: string;
  deliveryAddress: string;
  neighborhoodZone?: string;
  deliveryNotes?: string;
  paymentStatus?: 'PAGADO' | 'PENDIENTE_CONTRAENTREGA' | 'CUENTA_CORRIENTE';
  totalAmount?: number;
  copies?: number;
  widthMm?: number;
  heightMm?: number;
}

export interface LabelPrintResponseDTO {
  protocol: PrinterProtocol;
  labelType: 'PRODUCT_FRACTIONED' | 'SHIPPING_LOGISTICS';
  widthMm: number;
  heightMm: number;
  tsplCode?: string;
  niimbotPacketHex?: string[];
  canvasRenderInstructions?: any;
  copies: number;
  timestamp: string;
}
