"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleFamilyService = void 0;
const initialFamilies = [
    // --- RAW MATERIALS ---
    { id: '10000000-0000-0000-0000-000000000001', parentId: null, code: 'FAM-SEM', name: 'Semillas & Granos', articleScope: 'RAW_MATERIAL', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000002', parentId: '10000000-0000-0000-0000-000000000001', code: 'SUB-CHIA', name: 'Chía', articleScope: 'RAW_MATERIAL', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000003', parentId: '10000000-0000-0000-0000-000000000001', code: 'SUB-LINO', name: 'Lino', articleScope: 'RAW_MATERIAL', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000004', parentId: '10000000-0000-0000-0000-000000000001', code: 'SUB-AVEN', name: 'Avena', articleScope: 'RAW_MATERIAL', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000005', parentId: '10000000-0000-0000-0000-000000000001', code: 'SUB-QUIN', name: 'Quinoa', articleScope: 'RAW_MATERIAL', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000010', parentId: null, code: 'FAM-FRU', name: 'Frutos Secos & Deshidratados', articleScope: 'RAW_MATERIAL', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000011', parentId: '10000000-0000-0000-0000-000000000010', code: 'SUB-ALM', name: 'Almendras', articleScope: 'RAW_MATERIAL', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000012', parentId: '10000000-0000-0000-0000-000000000010', code: 'SUB-NUEZ', name: 'Nueces', articleScope: 'RAW_MATERIAL', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000020', parentId: null, code: 'FAM-HAR', name: 'Harinas & Almidones', articleScope: 'RAW_MATERIAL', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000021', parentId: null, code: 'FAM-ACE', name: 'Aceites & Mantecas', articleScope: 'RAW_MATERIAL', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000022', parentId: null, code: 'FAM-END', name: 'Endulzantes & Mieles', articleScope: 'RAW_MATERIAL', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000023', parentId: null, code: 'FAM-ESP', name: 'Especias & Condimentos', articleScope: 'RAW_MATERIAL', sortOrder: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10000000-0000-0000-0000-000000000024', parentId: null, code: 'FAM-SUP', name: 'Superalimentos & Suplementos', articleScope: 'RAW_MATERIAL', sortOrder: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // --- FINAL PRODUCTS ---
    { id: '20000000-0000-0000-0000-000000000001', parentId: null, code: 'FAM-FRA', name: 'Fraccionados Bolsa/Doypack', articleScope: 'FINAL_PRODUCT', sortOrder: 8, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000002', parentId: '20000000-0000-0000-0000-000000000001', code: 'SUB-250G', name: 'Presentación 250g', articleScope: 'FINAL_PRODUCT', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000003', parentId: '20000000-0000-0000-0000-000000000001', code: 'SUB-500G', name: 'Presentación 500g', articleScope: 'FINAL_PRODUCT', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000004', parentId: '20000000-0000-0000-0000-000000000001', code: 'SUB-1KG', name: 'Presentación 1kg', articleScope: 'FINAL_PRODUCT', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000010', parentId: null, code: 'FAM-MEZ', name: 'Mezclas & Blends', articleScope: 'FINAL_PRODUCT', sortOrder: 9, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000011', parentId: null, code: 'FAM-GRA', name: 'Granolas & Cereales', articleScope: 'FINAL_PRODUCT', sortOrder: 10, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '20000000-0000-0000-0000-000000000012', parentId: null, code: 'FAM-SNK', name: 'Snacks & Barritas', articleScope: 'FINAL_PRODUCT', sortOrder: 11, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // --- PACKAGING ---
    { id: '30000000-0000-0000-0000-000000000001', parentId: null, code: 'FAM-ENV', name: 'Envases & Contenedores', articleScope: 'PACKAGING', sortOrder: 12, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '30000000-0000-0000-0000-000000000002', parentId: '30000000-0000-0000-0000-000000000001', code: 'SUB-DOYP', name: 'Bolsas Doypack', articleScope: 'PACKAGING', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '30000000-0000-0000-0000-000000000003', parentId: '30000000-0000-0000-0000-000000000001', code: 'SUB-FRAS', name: 'Frascos de Vidrio', articleScope: 'PACKAGING', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '30000000-0000-0000-0000-000000000010', parentId: null, code: 'FAM-ETQ', name: 'Etiquetas & Rótulos', articleScope: 'PACKAGING', sortOrder: 13, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '30000000-0000-0000-0000-000000000011', parentId: null, code: 'FAM-EMB', name: 'Embalaje & Transporte', articleScope: 'PACKAGING', sortOrder: 14, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];
class ArticleFamilyService {
    db;
    inMemoryFamilies = [...initialFamilies];
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
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          parent_id UUID REFERENCES article_families(id),
          code VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          article_scope VARCHAR(50) NOT NULL DEFAULT 'ALL',
          icon VARCHAR(100),
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
            await this.db.query(`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS family_id UUID;`);
            await this.db.query(`ALTER TABLE final_products ADD COLUMN IF NOT EXISTS family_id UUID;`);
            await this.db.query(`ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS family_id UUID;`);
            // Check if table is empty, seed initial families if so
            const countRes = await this.db.query(`SELECT COUNT(*) FROM article_families;`);
            if (parseInt(countRes.rows[0].count) === 0) {
                for (const fam of initialFamilies) {
                    await this.db.query(`
            INSERT INTO article_families (id, parent_id, code, name, article_scope, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (code) DO NOTHING;
          `, [fam.id, fam.parentId, fam.code, fam.name, fam.articleScope, fam.sortOrder]);
                }
            }
            this.isTableInitialized = true;
        }
        catch (e) {
            console.error('Error initializing tables:', e);
        }
    }
    mapRowToFamily(row) {
        return {
            id: row.id,
            parentId: row.parentId,
            code: row.code,
            name: row.name,
            description: row.description,
            articleScope: row.articleScope,
            icon: row.icon,
            sortOrder: parseInt(row.sortOrder) || 0,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            childCount: row.childCount ? parseInt(row.childCount) : 0,
            parentName: row.parentName
        };
    }
    async getAll() {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        SELECT f.id, f.parent_id AS "parentId", f.code, f.name, f.description, 
               f.article_scope AS "articleScope", f.icon, f.sort_order AS "sortOrder", 
               f.is_active AS "isActive", f.created_at AS "createdAt", f.updated_at AS "updatedAt",
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = TRUE) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.is_active = TRUE
        ORDER BY f.sort_order ASC, f.name ASC;
      `);
            if (res.rows.length > 0) {
                return res.rows.map(this.mapRowToFamily);
            }
        }
        catch { }
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
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = TRUE) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.is_active = TRUE AND (f.article_scope = $1 OR f.article_scope = 'ALL')
        ORDER BY f.sort_order ASC, f.name ASC;
      `, [scope]);
            if (res.rows.length > 0) {
                return res.rows.map(this.mapRowToFamily);
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
               (SELECT COUNT(*) FROM article_families c WHERE c.parent_id = f.id AND c.is_active = TRUE) AS "childCount",
               p.name AS "parentName"
        FROM article_families f
        LEFT JOIN article_families p ON f.parent_id = p.id
        WHERE f.id = $1 AND f.is_active = TRUE;
      `, [id]);
            if (res.rows.length > 0)
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
        try {
            const res = await this.db.query(`
        INSERT INTO article_families (parent_id, code, name, description, article_scope, icon, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, parent_id AS "parentId", code, name, description, 
                  article_scope AS "articleScope", icon, sort_order AS "sortOrder", 
                  is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";
      `, [
                dto.parentId || null, dto.code, dto.name, dto.description || null,
                dto.articleScope || 'ALL', dto.icon || null, dto.sortOrder || 0
            ]);
            return this.mapRowToFamily(res.rows[0]);
        }
        catch {
            const newFamily = {
                id: 'fam-' + Date.now(),
                parentId: dto.parentId || null,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                articleScope: dto.articleScope || 'ALL',
                icon: dto.icon,
                sortOrder: dto.sortOrder || 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.inMemoryFamilies.push(newFamily);
            return newFamily;
        }
    }
    async update(id, dto) {
        await this.ensureTableExists();
        try {
            const updates = [];
            const values = [];
            let i = 1;
            if (dto.parentId !== undefined) {
                updates.push(`parent_id = $${i++}`);
                values.push(dto.parentId);
            }
            if (dto.code !== undefined) {
                updates.push(`code = $${i++}`);
                values.push(dto.code);
            }
            if (dto.name !== undefined) {
                updates.push(`name = $${i++}`);
                values.push(dto.name);
            }
            if (dto.description !== undefined) {
                updates.push(`description = $${i++}`);
                values.push(dto.description);
            }
            if (dto.articleScope !== undefined) {
                updates.push(`article_scope = $${i++}`);
                values.push(dto.articleScope);
            }
            if (dto.icon !== undefined) {
                updates.push(`icon = $${i++}`);
                values.push(dto.icon);
            }
            if (dto.sortOrder !== undefined) {
                updates.push(`sort_order = $${i++}`);
                values.push(dto.sortOrder);
            }
            if (dto.isActive !== undefined) {
                updates.push(`is_active = $${i++}`);
                values.push(dto.isActive);
            }
            if (updates.length === 0)
                return this.getById(id);
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            const res = await this.db.query(`
        UPDATE article_families
        SET ${updates.join(', ')}
        WHERE id = $${i}
        RETURNING id, parent_id AS "parentId", code, name, description, 
                  article_scope AS "articleScope", icon, sort_order AS "sortOrder", 
                  is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";
      `, values);
            if (res.rows.length > 0)
                return this.mapRowToFamily(res.rows[0]);
        }
        catch { }
        const index = this.inMemoryFamilies.findIndex(f => f.id === id);
        if (index !== -1) {
            this.inMemoryFamilies[index] = {
                ...this.inMemoryFamilies[index],
                ...dto,
                updatedAt: new Date().toISOString()
            };
            return this.inMemoryFamilies[index];
        }
        return null;
    }
    async delete(id) {
        await this.ensureTableExists();
        try {
            const res = await this.db.query(`
        UPDATE article_families
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id;
      `, [id]);
            if (res.rows.length > 0)
                return true;
        }
        catch { }
        const f = this.inMemoryFamilies.find(x => x.id === id);
        if (f) {
            f.isActive = false;
            f.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }
}
exports.ArticleFamilyService = ArticleFamilyService;
