"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoInitDatabase = exports.createDatabasePool = exports.MySQLAdapter = void 0;
const mysqlAdapter_1 = require("./mysqlAdapter");
Object.defineProperty(exports, "MySQLAdapter", { enumerable: true, get: function () { return mysqlAdapter_1.MySQLAdapter; } });
Object.defineProperty(exports, "createDatabasePool", { enumerable: true, get: function () { return mysqlAdapter_1.createDatabasePool; } });
const autoInit_1 = require("./autoInit");
Object.defineProperty(exports, "autoInitDatabase", { enumerable: true, get: function () { return autoInit_1.autoInitDatabase; } });
