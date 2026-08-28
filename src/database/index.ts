import { MySQLAdapter, createDatabasePool } from './mysqlAdapter';

export type { QueryResult, PoolClient } from './mysqlAdapter';
export { MySQLAdapter, createDatabasePool };

/**
 * Pool type compatible — permite que los servicios existentes
 * acepten tanto pg.Pool como MySQLAdapter sin cambiar firmas
 */
export type DatabasePool = MySQLAdapter;
