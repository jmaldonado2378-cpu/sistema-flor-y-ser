"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnectionError = exports.autoInitDatabase = exports.createDatabasePool = exports.MySQLAdapter = void 0;
const mysqlAdapter_1 = require("./mysqlAdapter");
Object.defineProperty(exports, "MySQLAdapter", { enumerable: true, get: function () { return mysqlAdapter_1.MySQLAdapter; } });
Object.defineProperty(exports, "createDatabasePool", { enumerable: true, get: function () { return mysqlAdapter_1.createDatabasePool; } });
Object.defineProperty(exports, "isConnectionError", { enumerable: true, get: function () { return mysqlAdapter_1.isConnectionError; } });
const autoInit_1 = require("./autoInit");
Object.defineProperty(exports, "autoInitDatabase", { enumerable: true, get: function () { return autoInit_1.autoInitDatabase; } });
