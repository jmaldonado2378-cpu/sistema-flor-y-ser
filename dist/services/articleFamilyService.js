"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleFamilyService = exports.initialFamilies = void 0;
const nowIso = () => new Date().toISOString();
exports.initialFamilies = [
    // 1. Frutos Secos
    { id: 'fam-frutos-secos', parentId: null, code: 'FRUTOS_SECOS', name: 'Frutos Secos', articleScope: 'ALL', icon: 'Nut', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-mix-frutos', parentId: 'fam-frutos-secos', code: 'MIX_FRUTOS', name: 'Mix de frutos secos', articleScope: 'ALL', icon: 'Package', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 2. Harinas
    { id: 'fam-harinas', parentId: null, code: 'HARINAS', name: 'Harinas', articleScope: 'ALL', icon: 'Wheat', sortOrder: 2, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 3. Semillas
    { id: 'fam-semillas', parentId: null, code: 'SEMILLAS', name: 'Semillas', articleScope: 'ALL', icon: 'Sprout', sortOrder: 3, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 4. Hierbas
    { id: 'fam-hierbas', parentId: null, code: 'HIERBAS', name: 'Hierbas', articleScope: 'ALL', icon: 'Leaf', sortOrder: 4, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-mezcla-hierbas', parentId: 'fam-hierbas', code: 'MEZCLA_HIERBAS', name: 'Mezcla de hierbas', articleScope: 'ALL', icon: 'Sparkles', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 5. Condimentos
    { id: 'fam-condimentos', parentId: null, code: 'CONDIMENTOS', name: 'Condimentos', articleScope: 'ALL', icon: 'Utensils', sortOrder: 5, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-especias', parentId: 'fam-condimentos', code: 'ESPECIAS', name: 'Especias', articleScope: 'ALL', icon: 'Flame', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 6. Repostería
    { id: 'fam-reposteria', parentId: null, code: 'REPOSTERIA', name: 'Repostería', articleScope: 'ALL', icon: 'Cake', sortOrder: 6, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 7. Tinturas madres
    { id: 'fam-tinturas-madres', parentId: null, code: 'TINTURAS_MADRES', name: 'Tinturas madres', articleScope: 'ALL', icon: 'FlaskConical', sortOrder: 7, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-tinturas-simples', parentId: 'fam-tinturas-madres', code: 'TINTURAS_SIMPLES', name: 'Simples', articleScope: 'ALL', icon: 'FlaskConical', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-tinturas-compuestas', parentId: 'fam-tinturas-madres', code: 'TINTURAS_COMPUESTAS', name: 'Compuestas', articleScope: 'ALL', icon: 'FlaskConical', sortOrder: 2, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 8. Hongos adaptógenos
    { id: 'fam-hongos', parentId: null, code: 'HONGOS_ADAPTOGENOS', name: 'Hongos adaptógenos', articleScope: 'ALL', icon: 'Activity', sortOrder: 8, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-hongos-simples', parentId: 'fam-hongos', code: 'HONGOS_SIMPLES', name: 'Simples', articleScope: 'ALL', icon: 'Activity', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-hongos-compuestos', parentId: 'fam-hongos', code: 'HONGOS_COMPUESTOS', name: 'Compuestos', articleScope: 'ALL', icon: 'Activity', sortOrder: 2, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 9. Infusiones
    { id: 'fam-infusiones', parentId: null, code: 'INFUSIONES', name: 'Infusiones', articleScope: 'ALL', icon: 'Coffee', sortOrder: 9, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 10. Yerbas mates
    { id: 'fam-yerba-mate', parentId: null, code: 'YERBAS_MATES', name: 'Yerbas mates', articleScope: 'ALL', icon: 'CupSoda', sortOrder: 10, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 11. Aceites
    { id: 'fam-aceites', parentId: null, code: 'ACEITES', name: 'Aceites', articleScope: 'ALL', icon: 'Droplet', sortOrder: 11, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-aceites-esenciales', parentId: 'fam-aceites', code: 'ACEITES_ESENCIALES', name: 'Esenciales', articleScope: 'ALL', icon: 'Droplets', sortOrder: 1, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-aceites-cosmetica', parentId: 'fam-aceites', code: 'ACEITES_COSMETICA', name: 'Cosmética', articleScope: 'ALL', icon: 'Sparkles', sortOrder: 2, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-aceites-macerados', parentId: 'fam-aceites', code: 'ACEITES_MACERADOS', name: 'Macerados/cosmética', articleScope: 'ALL', icon: 'Droplet', sortOrder: 3, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-aceites-coco', parentId: 'fam-aceites', code: 'ACEITES_COCO', name: 'Coco', articleScope: 'ALL', icon: 'Droplet', sortOrder: 4, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'fam-aceites-comestibles', parentId: 'fam-aceites', code: 'ACEITES_COMESTIBLES', name: 'Comestibles', articleScope: 'ALL', icon: 'Droplet', sortOrder: 5, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    // 12. Materiales de Empaque
    { id: 'fam-empaques', parentId: null, code: 'EMPAQUES', name: 'Materiales de Empaque', articleScope: 'PACKAGING', icon: 'Box', sortOrder: 12, isActive: true, createdAt: nowIso(), updatedAt: nowIso() }
];
class ArticleFamilyService {
    db;
    inMemoryFamilies = [...exports.initialFamilies];
    isTableInitialized = false;
    constructor(db) {
        this.db = db;
    }
    async ensureTableExists() {
        if (this.isTableInitialized)
            return;
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS article_families (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          parent_id VARCHAR(64),
          code VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          article_scope VARCHAR(50) NOT NULL DEFAULT 'ALL',
          icon VARCHAR(100),
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active TINYINT(1) DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
            try {
                await this.db.query(`ALTER TABLE raw_materials ADD COLUMN family_id VARCHAR(64);`);
            }
            catch { }
            try {
                await this.db.query(`ALTER TABLE final_products ADD COLUMN family_id VARCHAR(64);`);
            }
            catch { }
            try {
                await this.db.query(`ALTER TABLE packaging_materials ADD COLUMN family_id VARCHAR(64);`);
            }
            catch { }
            // Sincronizar el esquema oficial de familias y sub-familias si aún no existe una de las nuevas sub-familias clave o si quedan familias demo viejas
            const checkNewSchema = await this.db.query(`SELECT COUNT(*) as cnt FROM article_families WHERE id = 'fam-aceites-comestibles' AND parent_id = 'fam-aceites'`);
            const checkOldDemo = await this.db.query(`SELECT COUNT(*) as cnt FROM article_families WHERE id LIKE '10000000-%' OR code IN ('FAM-SEM', 'SUB-CHIA', 'FAM-FRU')`);
            const hasNewSchema = parseInt(checkNewSchema.rows?.[0]?.cnt || checkNewSchema.rows?.[0]?.COUNT || '0', 10) > 0;
            const hasOldDemo = parseInt(checkOldDemo.rows?.[0]?.cnt || checkOldDemo.rows?.[0]?.COUNT || '0', 10) > 0;
            if (!hasNewSchema || hasOldDemo) {
                const migrated = await this.migrateToOfficialHierarchy();
                if (migrated) {
                    this.isTableInitialized = true;
                }
            }
            else {
                this.isTableInitialized = true;
            }
        }
        catch (e) {
            console.error('Error initializing article_families:', e);
        }
    }
    async migrateToOfficialHierarchy() {
        try {
            await this.db.query('SET FOREIGN_KEY_CHECKS = 0');
            // 1. Limpiar familias demo obsoletas (10000000-*, 20000000-*, 30000000-*, fam-suplementos y códigos demo antiguos)
            await this.db.query(`
        DELETE FROM article_families
        WHERE id LIKE '10000000-%'
           OR id LIKE '20000000-%'
           OR id LIKE '30000000-%'
           OR id = 'fam-suplementos'
           OR code IN (
             'FAM-SEM','SUB-CHIA','SUB-LINO','SUB-AVEN','SUB-QUIN',
             'FAM-FRU','SUB-ALM','SUB-NUEZ','FAM-HAR','FAM-ACE',
             'FAM-END','FAM-ESP','FAM-SUP','FAM-FRA','SUB-250G',
             'SUB-500G','SUB-1KG','FAM-MEZ','FAM-GRA','FAM-SNK',
             'FAM-ENV','SUB-DOYP','SUB-FRAS','FAM-ETQ','FAM-EMB'
           )
      `);
            // 2. Insertar o actualizar todas las familias y sub-familias del esquema oficial
            for (const fam of exports.initialFamilies) {
                try {
                    await this.db.query(`DELETE FROM article_families WHERE code = $1 AND id <> $2`, [fam.code, fam.id]);
                }
                catch { }
                await this.db.query(`
          INSERT INTO article_families (id, parent_id, code, name, description, article_scope, icon, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
          ON DUPLICATE KEY UPDATE
            parent_id = VALUES(parent_id),
            code = VALUES(code),
            name = VALUES(name),
            article_scope = VALUES(article_scope),
            icon = VALUES(icon),
            sort_order = VALUES(sort_order),
            is_active = 1;
        `, [fam.id, fam.parentId, fam.code, fam.name, fam.name, fam.articleScope, fam.icon || 'Package', fam.sortOrder]);
            }
            // 3. Reasignar automáticamente Materias Primas a sus nuevas familias / sub-familias
            await this.db.query(`
        UPDATE raw_materials
        SET family_id = 'fam-aceites-coco'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales', '') OR id LIKE '%aceite%')
          AND (LOWER(id) LIKE '%coco%' OR LOWER(name) LIKE '%coco%')
          AND (LOWER(id) LIKE '%aceite%' OR LOWER(name) LIKE '%aceite%')
      `);
            await this.db.query(`
        UPDATE raw_materials
        SET family_id = 'fam-aceites-macerados'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales', '') OR id LIKE '%aceite%')
          AND (LOWER(id) LIKE '%macerado%' OR LOWER(name) LIKE '%macerado%')
      `);
            await this.db.query(`
        UPDATE raw_materials
        SET family_id = 'fam-aceites-esenciales'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales', '') OR id LIKE '%aceite%')
          AND (LOWER(id) LIKE '%esencial%' OR LOWER(name) LIKE '%esencial%' OR LOWER(id) LIKE '%puro-de-romero%')
      `);
            // 4. Reasignar automáticamente Productos Finales a sus nuevas familias / sub-familias
            // Tinturas madres -> Simples vs Compuestas
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-tinturas-compuestas'
        WHERE (COALESCE(family_id, '') = 'fam-tinturas-madres' OR id LIKE 'fp-tm-%')
          AND (id LIKE 'fp-tm-comp-%' OR LOWER(name) LIKE '%compuesta%')
      `);
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-tinturas-simples'
        WHERE (COALESCE(family_id, '') = 'fam-tinturas-madres' OR id LIKE 'fp-tm-smp-%')
          AND COALESCE(family_id, '') <> 'fam-tinturas-compuestas'
      `);
            // Hongos adaptógenos -> Simples vs Compuestos
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-hongos-compuestos'
        WHERE (COALESCE(family_id, '') = 'fam-hongos' OR id LIKE 'fp-hongo-%')
          AND (id LIKE 'fp-hongo-comp-%' OR LOWER(id) LIKE '%mezcla%' OR LOWER(name) LIKE '%compuesto%' OR LOWER(name) LIKE '%mezcla%')
      `);
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-hongos-simples'
        WHERE (COALESCE(family_id, '') = 'fam-hongos' OR id LIKE 'fp-hongo-%')
          AND COALESCE(family_id, '') <> 'fam-hongos-compuestos'
      `);
            // Aceites -> Esenciales, Cosmética, Macerados/cosmética, Coco, Comestibles
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-aceites-coco'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales') OR id LIKE '%aceite%')
          AND (LOWER(id) LIKE '%coco%' OR LOWER(name) LIKE '%coco%')
          AND (LOWER(id) LIKE '%aceite%' OR LOWER(name) LIKE '%aceite%')
      `);
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-aceites-macerados'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales') OR id LIKE 'fp-macer-%')
          AND (id LIKE 'fp-macer-%' OR LOWER(name) LIKE '%macerado%')
      `);
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-aceites-cosmetica'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales') OR id LIKE 'fp-cosm-%')
          AND id LIKE 'fp-cosm-%'
      `);
            await this.db.query(`
        UPDATE final_products
        SET family_id = 'fam-aceites-esenciales'
        WHERE (COALESCE(family_id, '') IN ('fam-aceites', 'fam-aceites-esenciales') OR id LIKE 'fp-aceite-%')
          AND (id LIKE 'fp-aceite-%' OR LOWER(name) LIKE '%esencial%')
      `);
            await this.db.query('SET FOREIGN_KEY_CHECKS = 1');
            console.log('✅ Jerarquía oficial de Familias y Sub-familias sincronizada y artículos reasignados.');
            return true;
        }
        catch (err) {
            try {
                await this.db.query('SET FOREIGN_KEY_CHECKS = 1');
            }
            catch { }
            console.warn('⚠️ Nota al migrar jerarquía de familias:', err.message);
            return false;
        }
    }
    mapRowToFamily(row) {
        return {
            id: row.id,
            parentId: row.parentId || row.parent_id || null,
            code: row.code,
            name: row.name,
            description: row.description,
            articleScope: row.articleScope || row.article_scope || 'ALL',
            icon: row.icon,
            sortOrder: parseInt(row.sortOrder ?? row.sort_order) || 0,
            isActive: row.isActive === 1 || row.isActive === true || row.is_active === 1 || row.is_active === true,
            createdAt: row.createdAt || row.created_at,
            updatedAt: row.updatedAt || row.updated_at,
            childCount: row.childCount !== undefined ? parseInt(row.childCount) : 0,
            parentName: row.parentName || row.parent_name
        };
    }
    async getAll() {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT f.id, f.parent_id AS "parentId", f.code, f.name, f.description, 
               f.article_scope AS "articleScope", f.icon, f.sort_order AS "sortOrder", 
               f.is_active AS "isActive", f.created_at AS "createdAt", f.updated_at AS "updatedAt",
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = 1) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.is_active = 1
        ORDER BY f.sort_order ASC, f.name ASC;
      `);
            if (res.rows && res.rows.length > 0) {
                return res.rows.map((r) => this.mapRowToFamily(r));
            }
        }
        catch (err) {
            console.warn('⚠️ Fallback en articleFamilyService.getAll:', err.message);
        }
        return this.inMemoryFamilies
            .filter(f => f.isActive)
            .map(f => {
            const childCount = this.inMemoryFamilies.filter(c => c.parentId === f.id && c.isActive).length;
            const parent = this.inMemoryFamilies.find(p => p.id === f.parentId);
            return { ...f, childCount, parentName: parent?.name };
        })
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    async getByScope(scope) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT f.id, f.parent_id AS "parentId", f.code, f.name, f.description, 
               f.article_scope AS "articleScope", f.icon, f.sort_order AS "sortOrder", 
               f.is_active AS "isActive", f.created_at AS "createdAt", f.updated_at AS "updatedAt",
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = 1) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.is_active = 1 AND (f.article_scope = $1 OR f.article_scope = 'ALL')
        ORDER BY f.sort_order ASC, f.name ASC;
      `, [scope]);
            if (res.rows && res.rows.length > 0) {
                return res.rows.map((r) => this.mapRowToFamily(r));
            }
        }
        catch { }
        return this.inMemoryFamilies
            .filter(f => f.isActive && (f.articleScope === scope || f.articleScope === 'ALL'))
            .map(f => {
            const childCount = this.inMemoryFamilies.filter(c => c.parentId === f.id && c.isActive).length;
            const parent = this.inMemoryFamilies.find(p => p.id === f.parentId);
            return { ...f, childCount, parentName: parent?.name };
        })
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    async getById(id) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT f.id, f.parent_id AS "parentId", f.code, f.name, f.description, 
               f.article_scope AS "articleScope", f.icon, f.sort_order AS "sortOrder", 
               f.is_active AS "isActive", f.created_at AS "createdAt", f.updated_at AS "updatedAt",
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = 1) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.id = $1 AND f.is_active = 1;
      `, [id]);
            if (res.rows && res.rows.length > 0)
                return this.mapRowToFamily(res.rows[0]);
        }
        catch { }
        const f = this.inMemoryFamilies.find(x => x.id === id && x.isActive);
        if (f) {
            const childCount = this.inMemoryFamilies.filter(c => c.parentId === f.id && c.isActive).length;
            const parent = this.inMemoryFamilies.find(p => p.id === f.parentId);
            return { ...f, childCount, parentName: parent?.name };
        }
        return null;
    }
    async create(dto) {
        await this.ensureTableExists();
        const newId = 'fam-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        let finalCode = (dto.code || '').trim().toUpperCase();
        if (!finalCode) {
            const clean = (dto.name || 'FAM').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            finalCode = `${clean.substring(0, 4) || 'FAM'}-${Math.floor(100 + Math.random() * 900)}`;
        }
        const newFamily = {
            id: newId,
            parentId: dto.parentId || null,
            code: finalCode,
            name: dto.name,
            description: dto.description,
            articleScope: dto.articleScope || 'ALL',
            icon: dto.icon,
            sortOrder: dto.sortOrder || 0,
            isActive: true,
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        try {
            // Liberar el código si pertenecía a una familia inactiva o asegurar unicidad
            await this.db.query(`DELETE FROM article_families WHERE code = $1 AND is_active = 0`, [finalCode]);
            const dupCheck = await this.db.query(`SELECT id FROM article_families WHERE code = $1`, [finalCode]);
            if (dupCheck.rows && dupCheck.rows.length > 0) {
                finalCode = `${finalCode}-${Math.floor(100 + Math.random() * 900)}`;
                newFamily.code = finalCode;
            }
            await this.db.query(`
        INSERT INTO article_families (id, parent_id, code, name, description, article_scope, icon, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1);
      `, [
                newId,
                dto.parentId || null,
                finalCode,
                dto.name,
                dto.description || null,
                dto.articleScope || 'ALL',
                dto.icon || null,
                dto.sortOrder || 0
            ]);
            this.inMemoryFamilies.push(newFamily);
            const created = await this.getById(newId);
            return created || newFamily;
        }
        catch (err) {
            console.warn('⚠️ Fallback en articleFamilyService.create:', err.message);
            this.inMemoryFamilies.push(newFamily);
            return newFamily;
        }
    }
    async update(id, dto) {
        await this.ensureTableExists();
        // Actualizar también en memoria para mantener consistencia
        const memIndex = this.inMemoryFamilies.findIndex(f => f.id === id);
        if (memIndex !== -1) {
            this.inMemoryFamilies[memIndex] = {
                ...this.inMemoryFamilies[memIndex],
                ...(dto.parentId !== undefined ? { parentId: dto.parentId || null } : {}),
                ...(dto.code !== undefined ? { code: dto.code } : {}),
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.articleScope !== undefined ? { articleScope: dto.articleScope } : {}),
                ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
                ...(dto.sortOrder !== undefined ? { sortOrder: Number(dto.sortOrder) || 0 } : {}),
                ...(dto.isActive !== undefined ? { isActive: Boolean(dto.isActive) } : {}),
                updatedAt: nowIso()
            };
        }
        try {
            const updates = [];
            const values = [];
            let i = 1;
            if (dto.parentId !== undefined) {
                updates.push(`parent_id = $${i++}`);
                values.push(dto.parentId || null);
            }
            if (dto.code !== undefined) {
                let codeVal = dto.code.trim().toUpperCase();
                await this.db.query(`DELETE FROM article_families WHERE code = $1 AND id <> $2 AND is_active = 0`, [codeVal, id]);
                const dup = await this.db.query(`SELECT id FROM article_families WHERE code = $1 AND id <> $2`, [codeVal, id]);
                if (dup.rows && dup.rows.length > 0) {
                    codeVal = `${codeVal}-${Math.floor(100 + Math.random() * 900)}`;
                }
                updates.push(`code = $${i++}`);
                values.push(codeVal);
            }
            if (dto.name !== undefined) {
                updates.push(`name = $${i++}`);
                values.push(dto.name);
            }
            if (dto.description !== undefined) {
                updates.push(`description = $${i++}`);
                values.push(dto.description || null);
            }
            if (dto.articleScope !== undefined) {
                updates.push(`article_scope = $${i++}`);
                values.push(dto.articleScope);
            }
            if (dto.icon !== undefined) {
                updates.push(`icon = $${i++}`);
                values.push(dto.icon || null);
            }
            if (dto.sortOrder !== undefined) {
                updates.push(`sort_order = $${i++}`);
                values.push(Number(dto.sortOrder) || 0);
            }
            if (dto.isActive !== undefined) {
                updates.push(`is_active = $${i++}`);
                values.push(dto.isActive ? 1 : 0);
            }
            if (updates.length > 0) {
                updates.push(`updated_at = CURRENT_TIMESTAMP`);
                values.push(id);
                await this.db.query(`
          UPDATE article_families
          SET ${updates.join(', ')}
          WHERE id = $${i};
        `, values);
            }
            const updatedFromDb = await this.getById(id);
            if (updatedFromDb)
                return updatedFromDb;
        }
        catch (err) {
            console.warn('⚠️ Error en articleFamilyService.update:', err.message);
        }
        if (memIndex !== -1) {
            return this.inMemoryFamilies[memIndex];
        }
        return null;
    }
    async delete(id) {
        await this.ensureTableExists();
        // Actualizar memoria (tanto la familia como sus sub-familias)
        let foundInMem = false;
        for (const f of this.inMemoryFamilies) {
            if (f.id === id || f.parentId === id) {
                f.isActive = false;
                f.updatedAt = nowIso();
                foundInMem = true;
            }
        }
        try {
            // 1. Obtener IDs de sub-familias hijas para desvincular sus artículos también
            const childrenRes = await this.db.query(`SELECT id FROM article_families WHERE parent_id = $1`, [id]);
            const childIds = (childrenRes.rows || []).map((r) => r.id).filter(Boolean);
            const allIdsToUnlink = [id, ...childIds];
            for (const famId of allIdsToUnlink) {
                try {
                    await this.db.query(`UPDATE raw_materials SET family_id = NULL WHERE family_id = $1`, [famId]);
                }
                catch { }
                try {
                    await this.db.query(`UPDATE final_products SET family_id = NULL WHERE family_id = $1`, [famId]);
                }
                catch { }
                try {
                    await this.db.query(`UPDATE packaging_materials SET family_id = NULL WHERE family_id = $1`, [famId]);
                }
                catch { }
            }
            // 2. Eliminar sub-familias hijas y la familia principal
            await this.db.query(`DELETE FROM article_families WHERE parent_id = $1`, [id]);
            const delRes = await this.db.query(`DELETE FROM article_families WHERE id = $1`, [id]);
            if ((delRes.rowCount || 0) > 0)
                return true;
        }
        catch (err) {
            console.warn('⚠️ Fallback soft-delete en articleFamilyService.delete:', err.message);
            try {
                const suffix = `_DEL_${Date.now()}`;
                await this.db.query(`UPDATE article_families SET is_active = 0, code = CONCAT(code, $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR parent_id = $2`, [suffix, id]);
                return true;
            }
            catch { }
        }
        return foundInMem;
    }
}
exports.ArticleFamilyService = ArticleFamilyService;
