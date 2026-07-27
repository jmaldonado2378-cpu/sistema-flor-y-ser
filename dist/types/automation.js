"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationChannel = exports.AutomationType = void 0;
var AutomationType;
(function (AutomationType) {
    AutomationType["WELCOME"] = "WELCOME";
    AutomationType["REPLENISHMENT"] = "REPLENISHMENT";
    AutomationType["BIRTHDAY"] = "BIRTHDAY";
    AutomationType["NEW_ARRIVALS"] = "NEW_ARRIVALS";
})(AutomationType || (exports.AutomationType = AutomationType = {}));
var AutomationChannel;
(function (AutomationChannel) {
    AutomationChannel["WHATSAPP"] = "WHATSAPP";
    AutomationChannel["EMAIL"] = "EMAIL";
    AutomationChannel["BOTH"] = "BOTH";
})(AutomationChannel || (exports.AutomationChannel = AutomationChannel = {}));
