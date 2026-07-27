"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierPaymentMethod = exports.ReceiptType = exports.SupplierPaymentStatus = exports.MerchandiseType = void 0;
var MerchandiseType;
(function (MerchandiseType) {
    MerchandiseType["GRANEL"] = "GRANEL";
    MerchandiseType["ELABORADO"] = "ELABORADO"; // Productos finales elaborados o empaquetados (unidades)
})(MerchandiseType || (exports.MerchandiseType = MerchandiseType = {}));
var SupplierPaymentStatus;
(function (SupplierPaymentStatus) {
    SupplierPaymentStatus["PENDING"] = "PENDING";
    SupplierPaymentStatus["PARTIAL"] = "PARTIAL";
    SupplierPaymentStatus["PAID"] = "PAID";
    SupplierPaymentStatus["OVERDUE"] = "OVERDUE"; // Vencido
})(SupplierPaymentStatus || (exports.SupplierPaymentStatus = SupplierPaymentStatus = {}));
var ReceiptType;
(function (ReceiptType) {
    ReceiptType["FACTURA"] = "FACTURA";
    ReceiptType["REMITO"] = "REMITO";
    ReceiptType["NOTA_CREDITO"] = "NOTA_CREDITO";
})(ReceiptType || (exports.ReceiptType = ReceiptType = {}));
var SupplierPaymentMethod;
(function (SupplierPaymentMethod) {
    SupplierPaymentMethod["EFECTIVO"] = "EFECTIVO";
    SupplierPaymentMethod["TRANSFERENCIA"] = "TRANSFERENCIA";
    SupplierPaymentMethod["CHEQUE"] = "CHEQUE";
    SupplierPaymentMethod["MERCADO_PAGO"] = "MERCADO_PAGO";
    SupplierPaymentMethod["OTRO"] = "OTRO";
})(SupplierPaymentMethod || (exports.SupplierPaymentMethod = SupplierPaymentMethod = {}));
