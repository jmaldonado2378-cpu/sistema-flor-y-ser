"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const DEFAULT_PRICING_PARAMETERS = {
    fixedCostPercentage: 8.0,
    laborHourlyRate: 4000,
    defaultBatchHours: 2,
    defaultBatchUnits: 40,
    laborCostPercentage: 10.0,
    applyLaborToResale: false,
    taxPercentage: 0.0,
    roundingMultiple: 100,
    roundingMode: 'UP',
    defaultMostradorMarginPct: 50,
    defaultWhatsappMarginPct: 45,
    defaultOnlineMarginPct: 40
};
/**
 * Servicio encargado del manejo de la Configuración General del Sistema,
 * datos comerciales, comisiones por canal, parámetros de costos/precios e impresoras.
 */
class SettingsService {
    db;
    currentSettings = {
        businessInfo: {
            name: 'Flor y Ser Almacén Natural',
            cuit: '30-71689452-9',
            whatsapp: '+5491155439821',
            address: 'Av. Corrientes 3421, CABA, Argentina',
            logoUrl: '/logo.png'
        },
        printSettings: {
            defaultPrinter: 'NIIMBOT B1 Pro (Mostrador)',
            dpi: 203
        },
        channelCommissions: {
            mostrador: 0.0,
            whatsapp: 2.5,
            tiendaOnline: 5.0,
            mercadoPago: 4.5,
            tarjetas: 3.5
        },
        pricingParameters: { ...DEFAULT_PRICING_PARAMETERS },
        helpSettings: {
            supportEmail: 'soporte@floryser.com.ar',
            supportPhone: '+54 9 11 5543-9821',
            posGuide: 'Registre ventas en mostrador, aplique descuentos y gestione el ticket.',
            rawGuide: 'Asigne la familia correspondiente a cada insumo o granel.',
            permGuide: 'Configure el acceso a Kanban de Tareas por cada usuario vendedor.'
        },
        updatedAt: new Date().toISOString()
    };
    constructor(db) {
        this.db = db;
    }
    parseSettingValue(rawVal) {
        if (!rawVal)
            return null;
        if (typeof rawVal === 'string') {
            try {
                return JSON.parse(rawVal);
            }
            catch {
                return null;
            }
        }
        return rawVal;
    }
    /**
     * Obtiene la configuración actual del sistema.
     */
    async getSettings() {
        try {
            const query = `
        SELECT key_name, setting_value 
        FROM system_settings 
        WHERE is_active = TRUE;
      `;
            const res = await this.db.query(query);
            if (res.rows.length > 0) {
                const settingsMap = res.rows.reduce((acc, row) => {
                    acc[row.key_name] = this.parseSettingValue(row.setting_value);
                    return acc;
                }, {});
                if (settingsMap.businessInfo) {
                    this.currentSettings.businessInfo = {
                        ...this.currentSettings.businessInfo,
                        ...settingsMap.businessInfo
                    };
                }
                if (settingsMap.printSettings) {
                    this.currentSettings.printSettings = {
                        ...this.currentSettings.printSettings,
                        ...settingsMap.printSettings
                    };
                }
                if (settingsMap.channelCommissions) {
                    this.currentSettings.channelCommissions = {
                        ...this.currentSettings.channelCommissions,
                        ...settingsMap.channelCommissions
                    };
                }
                if (settingsMap.pricingParameters) {
                    this.currentSettings.pricingParameters = {
                        ...DEFAULT_PRICING_PARAMETERS,
                        ...this.currentSettings.pricingParameters,
                        ...settingsMap.pricingParameters
                    };
                }
                if (settingsMap.helpSettings) {
                    this.currentSettings.helpSettings = {
                        ...this.currentSettings.helpSettings,
                        ...settingsMap.helpSettings
                    };
                }
            }
        }
        catch {
            // Fallback a almacenamiento en memoria si no existe la tabla o no hay conexión BD
        }
        if (!this.currentSettings.pricingParameters) {
            this.currentSettings.pricingParameters = { ...DEFAULT_PRICING_PARAMETERS };
        }
        return this.currentSettings;
    }
    /**
     * Actualiza la configuración global del sistema de forma parcial o total.
     */
    async updateSettings(dto) {
        await this.getSettings();
        if (dto.businessInfo) {
            this.currentSettings.businessInfo = {
                ...this.currentSettings.businessInfo,
                ...dto.businessInfo
            };
        }
        if (dto.printSettings) {
            this.currentSettings.printSettings = {
                ...this.currentSettings.printSettings,
                ...dto.printSettings
            };
        }
        if (dto.channelCommissions) {
            this.currentSettings.channelCommissions = {
                ...this.currentSettings.channelCommissions,
                ...dto.channelCommissions
            };
        }
        if (dto.pricingParameters) {
            this.currentSettings.pricingParameters = {
                ...DEFAULT_PRICING_PARAMETERS,
                ...this.currentSettings.pricingParameters,
                ...dto.pricingParameters
            };
        }
        if (dto.helpSettings) {
            this.currentSettings.helpSettings = {
                ...this.currentSettings.helpSettings,
                ...dto.helpSettings
            };
        }
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    async updateBusinessInfo(dto) {
        await this.getSettings();
        this.currentSettings.businessInfo = {
            ...this.currentSettings.businessInfo,
            ...dto
        };
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    async updatePrintSettings(dto) {
        await this.getSettings();
        this.currentSettings.printSettings = {
            ...this.currentSettings.printSettings,
            ...dto
        };
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    async updateChannelCommissions(dto) {
        await this.getSettings();
        this.currentSettings.channelCommissions = {
            ...this.currentSettings.channelCommissions,
            ...dto
        };
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    async updatePricingParameters(dto) {
        await this.getSettings();
        this.currentSettings.pricingParameters = {
            ...DEFAULT_PRICING_PARAMETERS,
            ...this.currentSettings.pricingParameters,
            ...dto
        };
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    async updateHelpSettings(dto) {
        await this.getSettings();
        this.currentSettings.helpSettings = {
            ...this.currentSettings.helpSettings,
            ...dto
        };
        this.currentSettings.updatedAt = new Date().toISOString();
        await this.persistSettingsToDb();
        return this.currentSettings;
    }
    /**
     * Persiste la configuración en la base de datos MySQL si está disponible.
     */
    async persistSettingsToDb() {
        try {
            const upsertQuery = `
        INSERT INTO system_settings (key_name, setting_value, is_active, updated_at)
        VALUES 
          ('businessInfo', $1, TRUE, CURRENT_TIMESTAMP),
          ('printSettings', $2, TRUE, CURRENT_TIMESTAMP),
          ('channelCommissions', $3, TRUE, CURRENT_TIMESTAMP),
          ('pricingParameters', $4, TRUE, CURRENT_TIMESTAMP),
          ('helpSettings', $5, TRUE, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), is_active = TRUE, updated_at = CURRENT_TIMESTAMP;
      `;
            await this.db.query(upsertQuery, [
                JSON.stringify(this.currentSettings.businessInfo),
                JSON.stringify(this.currentSettings.printSettings),
                JSON.stringify(this.currentSettings.channelCommissions),
                JSON.stringify(this.currentSettings.pricingParameters || DEFAULT_PRICING_PARAMETERS),
                JSON.stringify(this.currentSettings.helpSettings || {})
            ]);
        }
        catch {
            // Si la base de datos no está disponible, se mantiene en memoria
        }
    }
}
exports.SettingsService = SettingsService;
