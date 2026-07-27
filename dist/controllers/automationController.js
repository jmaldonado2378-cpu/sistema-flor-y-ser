"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationController = void 0;
class AutomationController {
    automationService;
    constructor(automationService) {
        this.automationService = automationService;
    }
    /**
     * POST /api/v1/automations/welcome
     * Dispara el mensaje de bienvenida para un cliente específico.
     */
    sendWelcome = async (req, res) => {
        try {
            const dto = req.body;
            if (!dto.customerId) {
                res.status(400).json({ success: false, error: 'El campo customerId es obligatorio.' });
                return;
            }
            const log = await this.automationService.sendWelcomeMessage(dto);
            res.status(200).json({
                success: true,
                data: log,
                message: 'Mensaje de bienvenida y cupón promocional enviado/registrado con éxito.'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al enviar mensaje de bienvenida.', details: error.message });
        }
    };
    /**
     * POST /api/v1/automations/birthday/process
     * Procesa barrido automático de clientes que cumplen años.
     */
    processBirthday = async (req, res) => {
        try {
            const result = await this.automationService.processBirthdayAutomations();
            res.status(200).json({
                success: true,
                data: result,
                message: `Se procesaron salutaciones de cumpleaños para ${result.totalProcessed} cliente(s).`
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al procesar automatizaciones de cumpleaños.', details: error.message });
        }
    };
    /**
     * POST /api/v1/automations/replenishment/process
     * Procesa sugerencias y recordatorios de reposición para clientes inactivos.
     */
    processReplenishment = async (req, res) => {
        try {
            const daysThreshold = req.body.daysThreshold ? parseInt(req.body.daysThreshold, 10) : 20;
            const result = await this.automationService.processReplenishmentReminders(daysThreshold);
            res.status(200).json({
                success: true,
                data: result,
                message: `Se generaron ${result.totalSuggestions} recordatorios de reposición automatizados.`
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al procesar recordatorios de reposición.', details: error.message });
        }
    };
    /**
     * POST /api/v1/automations/broadcast/dietary
     * Difusión masiva de productos frescos / novedades segmentada por perfil dietético.
     */
    broadcastDietary = async (req, res) => {
        try {
            const dto = req.body;
            if (!dto.dietaryProfileCode || !dto.productName || !dto.customMessage) {
                res.status(400).json({
                    success: false,
                    error: 'Los campos dietaryProfileCode, productName y customMessage son obligatorios.'
                });
                return;
            }
            const result = await this.automationService.sendDietaryNewsBroadcast(dto);
            res.status(200).json({
                success: true,
                data: result,
                message: `Difusión de novedades enviada a ${result.totalSent} cliente(s) con perfil ${result.targetProfile}.`
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al realizar la difusión por perfil dietético.', details: error.message });
        }
    };
    /**
     * GET /api/v1/automations/logs
     * Consulta del registro de notificaciones y mensajes automatizados.
     */
    getLogs = async (req, res) => {
        try {
            const customerId = req.query.customerId;
            const logs = await this.automationService.getAutomationLogs(customerId);
            res.status(200).json({ success: true, data: logs });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al consultar logs de automatización.', details: error.message });
        }
    };
}
exports.AutomationController = AutomationController;
