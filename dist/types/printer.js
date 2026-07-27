"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterProtocol = exports.PrinterConnectionType = void 0;
var PrinterConnectionType;
(function (PrinterConnectionType) {
    PrinterConnectionType["BLUETOOTH"] = "BLUETOOTH";
    PrinterConnectionType["USB"] = "USB";
    PrinterConnectionType["WEBSOCKET_LOCAL"] = "WEBSOCKET_LOCAL";
    PrinterConnectionType["NETWORK"] = "NETWORK";
})(PrinterConnectionType || (exports.PrinterConnectionType = PrinterConnectionType = {}));
var PrinterProtocol;
(function (PrinterProtocol) {
    PrinterProtocol["NIIMBOT_PRO"] = "NIIMBOT_PRO";
    PrinterProtocol["TSPL"] = "TSPL";
    PrinterProtocol["ESC_POS"] = "ESC_POS";
    PrinterProtocol["CPCL"] = "CPCL";
})(PrinterProtocol || (exports.PrinterProtocol = PrinterProtocol = {}));
