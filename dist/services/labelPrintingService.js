"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelPrintingService = void 0;
const printer_1 = require("../types/printer");
class LabelPrintingService {
    /**
     * Genera comandos TSPL para impresoras térmicas (Zebra / Xprinter / Gaincha).
     */
    generateTSPLProductLabel(dto) {
        const width = dto.widthMm || 50;
        const height = dto.heightMm || 30;
        const copies = dto.copies || 1;
        const brand = dto.brandName || 'FLOR Y SER - ALMACEN NATURAL';
        const badges = (dto.dietaryBadges || []).join(' | ');
        return [
            `SIZE ${width} mm, ${height} mm`,
            `GAP 2 mm, 0 mm`,
            `SPEED 3`,
            `DENSITY 8`,
            `DIRECTION 1`,
            `REFERENCE 0,0`,
            `CLS`,
            `TEXT 15,10,"2",0,1,1,"${brand}"`,
            `TEXT 15,35,"3",0,1,1,"${dto.productName.substring(0, 30)}"`,
            `TEXT 15,70,"2",0,1,1,"PESO: ${dto.netWeightLabel} | LOTE: ${dto.batchNumber}"`,
            `TEXT 15,95,"2",0,1,1,"FRAC: ${dto.fractioningDate} | VENC: ${dto.expiryDate}"`,
            badges ? `TEXT 15,120,"1",0,1,1,"[ ${badges} ]"` : '',
            `BARCODE 15,145,"128",40,1,0,2,2,"${dto.barcode}"`,
            `PRINT 1,${copies}`,
            ''
        ].filter(Boolean).join('\r\n');
    }
    /**
     * Genera comandos TSPL para etiquetas de envío / logística.
     */
    generateTSPLShippingLabel(dto) {
        const width = dto.widthMm || 50;
        const height = dto.heightMm || 50;
        const copies = dto.copies || 1;
        return [
            `SIZE ${width} mm, ${height} mm`,
            `GAP 2 mm, 0 mm`,
            `SPEED 3`,
            `DENSITY 8`,
            `DIRECTION 1`,
            `REFERENCE 0,0`,
            `CLS`,
            `TEXT 15,10,"3",0,1,1,"FLOR Y SER - DELIVERIES"`,
            `TEXT 15,40,"2",0,1,1,"PEDIDO: #${dto.orderNumber}"`,
            `TEXT 15,65,"3",0,1,1,"CLIENTE: ${dto.customerName}"`,
            `TEXT 15,95,"2",0,1,1,"TEL: ${dto.customerPhoneWhatsapp}"`,
            `TEXT 15,125,"2",0,1,1,"DIR: ${dto.deliveryAddress.substring(0, 35)}"`,
            dto.neighborhoodZone ? `TEXT 15,150,"2",0,1,1,"ZONA: ${dto.neighborhoodZone}"` : '',
            dto.paymentStatus ? `TEXT 15,175,"2",0,1,1,"ESTADO: ${dto.paymentStatus}"` : '',
            `BARCODE 15,200,"128",45,1,0,2,2,"${dto.orderNumber}"`,
            `PRINT 1,${copies}`,
            ''
        ].filter(Boolean).join('\r\n');
    }
    /**
     * Genera paquetes binarios del protocolo específico NIIMBOT B1 Pro (Bluetooth/USB).
     * Estructura del paquete NIIMBOT: [0x55, 0x55, Type, Length, Data..., Checksum (XOR), 0xAA, 0xAA]
     */
    generateNiimbotPacketData(commandType, payload) {
        const header = [0x55, 0x55];
        const len = payload.length;
        const checksum = payload.reduce((acc, curr) => acc ^ curr, commandType ^ len);
        const footer = [0xAA, 0xAA];
        return [...header, commandType, len, ...payload, checksum, ...footer];
    }
    /**
     * Genera trabajo de impresión para NIIMBOT B1 Pro.
     */
    generateNiimbotProductLabel(dto) {
        // 0x01: Start Print Job, 0x03: Set Density (3), 0x0E: Start Page, 0xF3: End Page, 0xF4: End Job
        const startJob = this.generateNiimbotPacketData(0x01, [0x01]);
        const setDensity = this.generateNiimbotPacketData(0x03, [0x03]);
        const pageStart = this.generateNiimbotPacketData(0x0E, [0x01, 0x32, 0x1E]); // 50x30 mm
        const endPage = this.generateNiimbotPacketData(0xF3, [0x01]);
        const endJob = this.generateNiimbotPacketData(0xF4, [0x01]);
        const packetHexList = [startJob, setDensity, pageStart, endPage, endJob].map(pkt => pkt.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        const canvasRenderInstructions = {
            model: 'NIIMBOT B1 Pro',
            labelWidthMm: dto.widthMm || 50,
            labelHeightMm: dto.heightMm || 30,
            dpi: 203,
            elements: [
                { type: 'header', text: dto.brandName || 'FLOR Y SER - ALMACÉN NATURAL', fontSize: 9, align: 'center', weight: 'bold' },
                { type: 'product_name', text: dto.productName, fontSize: 13, align: 'center', weight: 'bold' },
                { type: 'spec_row_1', weightLabel: dto.netWeightLabel, batch: dto.batchNumber },
                { type: 'spec_row_2', fracDate: dto.fractioningDate, expiryDate: dto.expiryDate },
                { type: 'badges', items: dto.dietaryBadges || ['VEGANO', 'SIN TACC'] },
                { type: 'barcode', code: dto.barcode, symbology: 'CODE128' }
            ]
        };
        return {
            protocol: printer_1.PrinterProtocol.NIIMBOT_PRO,
            labelType: 'PRODUCT_FRACTIONED',
            widthMm: dto.widthMm || 50,
            heightMm: dto.heightMm || 30,
            tsplCode: this.generateTSPLProductLabel(dto),
            niimbotPacketHex: packetHexList,
            canvasRenderInstructions,
            copies: dto.copies || 1,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Genera trabajo de etiqueta de logística / envío.
     */
    generateNiimbotShippingLabel(dto) {
        const tsplCode = this.generateTSPLShippingLabel(dto);
        const canvasRenderInstructions = {
            model: 'NIIMBOT B1 Pro',
            labelWidthMm: dto.widthMm || 50,
            labelHeightMm: dto.heightMm || 50,
            dpi: 203,
            elements: [
                { type: 'header', text: 'FLOR Y SER - ENVÍOS & LOGÍSTICA', fontSize: 11, align: 'center', weight: 'bold' },
                { type: 'order_number', text: `PEDIDO #${dto.orderNumber}`, fontSize: 14, align: 'center', weight: 'bold' },
                { type: 'customer', name: dto.customerName, phone: dto.customerPhoneWhatsapp },
                { type: 'address', address: dto.deliveryAddress, zone: dto.neighborhoodZone || 'CABA' },
                { type: 'notes', text: dto.deliveryNotes || 'Entregar en mano' },
                { type: 'status', paymentStatus: dto.paymentStatus || 'PAGADO', amount: dto.totalAmount || 0 },
                { type: 'barcode', code: dto.orderNumber, symbology: 'CODE128' }
            ]
        };
        return {
            protocol: printer_1.PrinterProtocol.NIIMBOT_PRO,
            labelType: 'SHIPPING_LOGISTICS',
            widthMm: dto.widthMm || 50,
            heightMm: dto.heightMm || 50,
            tsplCode,
            canvasRenderInstructions,
            copies: dto.copies || 1,
            timestamp: new Date().toISOString()
        };
    }
}
exports.LabelPrintingService = LabelPrintingService;
