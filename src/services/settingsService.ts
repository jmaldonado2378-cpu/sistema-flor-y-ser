import {
  SystemSettings,
  BusinessInfo,
  PrintSettings,
  ChannelCommissions,
  UpdateSystemSettingsDTO,
  UpdateBusinessInfoDTO,
  UpdatePrintSettingsDTO,
  UpdateChannelCommissionsDTO
} from '../types/settings';

/**
 * Servicio encargado del manejo de la Configuración General del Sistema,
 * datos comerciales, comisiones por canal e impresoras por defecto.
 */
export class SettingsService {
  private currentSettings: SystemSettings = {
    businessInfo: {
      name: 'Flor y Ser Almacén Natural',
      cuit: '30-71689452-9',
      whatsapp: '+5491155439821',
      address: 'Av. Corrientes 3421, CABA, Argentina',
      logoUrl: 'https://floryser.com.ar/assets/logo.png'
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
    updatedAt: new Date().toISOString()
  };

  constructor(private db: any) {}

  /**
   * Obtiene la configuración actual del sistema.
   */
  async getSettings(): Promise<SystemSettings> {
    try {
      const query = `
        SELECT key_name, setting_value 
        FROM system_settings 
        WHERE is_active = TRUE;
      `;
      const res = await this.db.query(query);

      if (res.rows.length > 0) {
        const settingsMap = res.rows.reduce((acc: any, row: any) => {
          acc[row.key_name] = row.setting_value;
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
      }
    } catch {
      // Fallback a almacenamiento en memoria si no existe la tabla o no hay conexión BD
    }

    return this.currentSettings;
  }

  /**
   * Actualiza la configuración global del sistema de forma parcial o total.
   */
  async updateSettings(dto: UpdateSystemSettingsDTO): Promise<SystemSettings> {
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

    this.currentSettings.updatedAt = new Date().toISOString();

    await this.persistSettingsToDb();

    return this.currentSettings;
  }

  /**
   * Actualiza únicamente la información comercial y fiscal.
   */
  async updateBusinessInfo(dto: UpdateBusinessInfoDTO): Promise<SystemSettings> {
    this.currentSettings.businessInfo = {
      ...this.currentSettings.businessInfo,
      ...dto
    };
    this.currentSettings.updatedAt = new Date().toISOString();

    await this.persistSettingsToDb();
    return this.currentSettings;
  }

  /**
   * Actualiza la configuración de impresión de etiquetas.
   */
  async updatePrintSettings(dto: UpdatePrintSettingsDTO): Promise<SystemSettings> {
    this.currentSettings.printSettings = {
      ...this.currentSettings.printSettings,
      ...dto
    };
    this.currentSettings.updatedAt = new Date().toISOString();

    await this.persistSettingsToDb();
    return this.currentSettings;
  }

  /**
   * Actualiza la estructura de comisiones por canal y medio de pago.
   */
  async updateChannelCommissions(dto: UpdateChannelCommissionsDTO): Promise<SystemSettings> {
    this.currentSettings.channelCommissions = {
      ...this.currentSettings.channelCommissions,
      ...dto
    };
    this.currentSettings.updatedAt = new Date().toISOString();

    await this.persistSettingsToDb();
    return this.currentSettings;
  }

  /**
   * Persiste la configuración en la base de datos PostgreSQL si está disponible.
   */
  private async persistSettingsToDb(): Promise<void> {
    try {
      const upsertQuery = `
        INSERT INTO system_settings (key_name, setting_value, updated_at)
        VALUES 
          ('businessInfo', $1, CURRENT_TIMESTAMP),
          ('printSettings', $2, CURRENT_TIMESTAMP),
          ('channelCommissions', $3, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP;
      `;

      await this.db.query(upsertQuery, [
        JSON.stringify(this.currentSettings.businessInfo),
        JSON.stringify(this.currentSettings.printSettings),
        JSON.stringify(this.currentSettings.channelCommissions)
      ]);
    } catch {
      // Si la base de datos no está creada o activa, los datos se mantienen en memoria
    }
  }
}
