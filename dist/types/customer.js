"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSegment = exports.AcquisitionChannel = void 0;
var AcquisitionChannel;
(function (AcquisitionChannel) {
    AcquisitionChannel["LOCAL"] = "LOCAL";
    AcquisitionChannel["WHATSAPP"] = "WHATSAPP";
    AcquisitionChannel["ONLINE_STORE"] = "ONLINE_STORE";
    AcquisitionChannel["INSTAGRAM"] = "INSTAGRAM";
})(AcquisitionChannel || (exports.AcquisitionChannel = AcquisitionChannel = {}));
var CustomerSegment;
(function (CustomerSegment) {
    CustomerSegment["OCASIONAL"] = "Ocasional";
    CustomerSegment["FRECUENTE"] = "Frecuente";
    CustomerSegment["VIP"] = "VIP";
    CustomerSegment["MAYORISTA"] = "Mayorista / Revendedor";
})(CustomerSegment || (exports.CustomerSegment = CustomerSegment = {}));
