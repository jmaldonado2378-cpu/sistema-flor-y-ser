import { MySQLAdapter, createDatabasePool, isConnectionError } from './mysqlAdapter';
import { autoInitDatabase } from './autoInit';
import { importCatalogSeed } from './seedCatalog';

export type { QueryResult, PoolClient, DbConnectionStatus } from './mysqlAdapter';
export { MySQLAdapter, createDatabasePool, autoInitDatabase, importCatalogSeed, isConnectionError };

/**
 * Pool type compatible — permite que los servicios existentes
 * acepten tanto pg.Pool como MySQLAdapter sin cambiar firmas
 */
export type DatabasePool = MySQLAdapter;
