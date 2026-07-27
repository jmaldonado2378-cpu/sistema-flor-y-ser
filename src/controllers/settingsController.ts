import { Request, Response } from 'express';
import { SettingsService } from '../services/settingsService';
import {
  UpdateSystemSettingsDTO,
  UpdateBusinessInfoDTO,
  UpdatePrintSettingsDTO,
  UpdateChannelCommissionsDTO
} from '../types/settings';

/**
 * Controlador HTTP REST para la gestión de Configuración del Sistema y Parámetros
 */
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * Endpoint GET /api/v1/settings
   * Obtiene la configuración general del sistema.
   */
  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingsService.getSettings();

      res.status(200).json({
        success: true,
        data: settings,
        message: 'Configuración del sistema obtenida correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al consultar la configuración del sistema.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PUT /api/v1/settings
   * Actualización global de la configuración.
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: UpdateSystemSettingsDTO = req.body;
      const updated = await this.settingsService.updateSettings(dto);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Configuración general actualizada exitosamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la configuración general.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PATCH /api/v1/settings/business-info
   * Actualización de la información comercial y fiscal.
   */
  updateBusinessInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: UpdateBusinessInfoDTO = req.body;
      const updated = await this.settingsService.updateBusinessInfo(dto);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Datos comerciales actualizados correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la información comercial.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PATCH /api/v1/settings/print
   * Actualización de parámetros de impresión térmica de etiquetas.
   */
  updatePrintSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: UpdatePrintSettingsDTO = req.body;
      const updated = await this.settingsService.updatePrintSettings(dto);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Configuración de impresión actualizada correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la configuración de impresión.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PATCH /api/v1/settings/commissions
   * Actualización del esquema de comisiones por canal de venta.
   */
  updateChannelCommissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: UpdateChannelCommissionsDTO = req.body;
      const updated = await this.settingsService.updateChannelCommissions(dto);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Comisiones por canal actualizadas correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar las comisiones por canal.',
        details: error.message
      });
    }
  };
}
