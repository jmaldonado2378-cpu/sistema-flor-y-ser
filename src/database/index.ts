import { MySQLAdapter, createDatabasePool, isConnectionError } from './mysqlAdapter';
import { autoInitDatabase } from './autoInit';

export type { QueryResult, PoolClient, DbConnectionStatus } from './mysqlAdapter';
export { MySQLAdapter, createDatabasePool, autoInitDatabase, isConnectionError };

/**
 * Pool type compatible — permite que los servicios existentes
 * acepten tanto pg.Pool como MySQLAdapter sin cambiar firmas
 */
export type DatabasePool = MySQLAdapter;
