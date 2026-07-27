"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
/**
 * Controlador HTTP REST para la gestión de Configuración del Sistema y Parámetros
 */
class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    /**
     * Endpoint GET /api/v1/settings
     * Obtiene la configuración general del sistema.
     */
    getSettings = async (req, res) => {
        try {
            const settings = await this.settingsService.getSettings();
            res.status(200).json({
                success: true,
                data: settings,
                message: 'Configuración del sistema obtenida correctamente.'
            });
        }
        catch (error) {
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
    updateSettings = async (req, res) => {
        try {
            const dto = req.body;
            const updated = await this.settingsService.updateSettings(dto);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Configuración general actualizada exitosamente.'
            });
        }
        catch (error) {
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
    updateBusinessInfo = async (req, res) => {
        try {
            const dto = req.body;
            const updated = await this.settingsService.updateBusinessInfo(dto);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Datos comerciales actualizados correctamente.'
            });
        }
        catch (error) {
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
    updatePrintSettings = async (req, res) => {
        try {
            const dto = req.body;
            const updated = await this.settingsService.updatePrintSettings(dto);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Configuración de impresión actualizada correctamente.'
            });
        }
        catch (error) {
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
    updateChannelCommissions = async (req, res) => {
        try {
            const dto = req.body;
            const updated = await this.settingsService.updateChannelCommissions(dto);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Comisiones por canal actualizadas correctamente.'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error al actualizar las comisiones por canal.',
                details: error.message
            });
        }
    };
}
exports.SettingsController = SettingsController;
