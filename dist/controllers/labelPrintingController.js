"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelPrintingController = void 0;
class LabelPrintingController {
    labelService;
    constructor(labelService) {
        this.labelService = labelService;
    }
    printProductLabel = async (req, res) => {
        try {
            const { productName, brandName, netWeightLabel, batchNumber, fractioningDate, expiryDate, barcode, ingredients, dietaryBadges, copies, widthMm, heightMm } = req.body;
            if (!productName || !netWeightLabel || !batchNumber || !expiryDate || !barcode) {
                res.status(400).json({ status: 'ERROR', message: 'Faltan campos obligatorios para generar la etiqueta de producto.' });
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            const result = this.labelService.generateNiimbotProductLabel({
                productName,
                brandName: brandName || 'FLOR Y SER - ALMACÉN NATURAL',
                netWeightLabel,
                batchNumber,
                fractioningDate: fractioningDate || today,
                expiryDate,
                barcode,
                ingredients,
                dietaryBadges: dietaryBadges || ['VEGANO', 'SIN TACC'],
                copies: copies ? parseInt(copies, 10) : 1,
                widthMm: widthMm ? parseInt(widthMm, 10) : 50,
                heightMm: heightMm ? parseInt(heightMm, 10) : 30
            });
            res.json({ status: 'SUCCESS', data: result });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    printShippingLabel = async (req, res) => {
        try {
            const { orderNumber, customerName, customerPhoneWhatsapp, deliveryAddress, neighborhoodZone, deliveryNotes, paymentStatus, totalAmount, copies, widthMm, heightMm } = req.body;
            if (!orderNumber || !customerName || !customerPhoneWhatsapp || !deliveryAddress) {
                res.status(400).json({ status: 'ERROR', message: 'Faltan campos obligatorios para la etiqueta de logística.' });
                return;
            }
            const result = this.labelService.generateNiimbotShippingLabel({
                orderNumber,
                customerName,
                customerPhoneWhatsapp,
                deliveryAddress,
                neighborhoodZone,
                deliveryNotes,
                paymentStatus,
                totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
                copies: copies ? parseInt(copies, 10) : 1,
                widthMm: widthMm ? parseInt(widthMm, 10) : 50,
                heightMm: heightMm ? parseInt(heightMm, 10) : 50
            });
            res.json({ status: 'SUCCESS', data: result });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.LabelPrintingController = LabelPrintingController;
