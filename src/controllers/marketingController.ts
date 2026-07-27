import { Request, Response } from 'express';
import { MarketingService } from '../services/marketingService';
import {
  CreateMarketingTemplateDTO,
  UpdateMarketingTemplateDTO,
  CreateMarketingCampaignDTO,
  UpdateMarketingCampaignDTO,
  AudienceFilter
} from '../types/marketing';

/**
 * Controlador HTTP REST para la gestión de WhatsApp Marketing (Plantillas y Campañas Masivas Segmentadas)
 */
export class MarketingController {
  constructor(private marketingService: MarketingService) {}

  // =========================================================================
  // ENDPOINTS DE PLANTILLAS (/api/v1/marketing/templates)
  // =========================================================================

  /**
   * Endpoint GET /api/v1/marketing/templates
   * Listado de plantillas de mensajes.
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.marketingService.getTemplates();
      res.status(200).json({
        success: true,
        total: templates.length,
        data: templates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al consultar las plantillas de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint GET /api/v1/marketing/templates/:id
   * Obtiene el detalle de una plantilla específica.
   */
  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.marketingService.getTemplateById(id);
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error: any) {
      if (error.message && error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error al obtener la plantilla de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint POST /api/v1/marketing/templates
   * Alta de nueva plantilla.
   */
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMarketingTemplateDTO = req.body;
      if (!dto.title || !dto.content) {
        res.status(400).json({
          success: false,
          error: 'El título (title) y el contenido (content) son obligatorios.'
        });
        return;
      }

      const template = await this.marketingService.createTemplate(dto);
      res.status(201).json({
        success: true,
        data: template,
        message: 'Plantilla de marketing creada exitosamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al registrar la plantilla de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PUT /api/v1/marketing/templates/:id
   * Edición de plantilla existente.
   */
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateMarketingTemplateDTO = req.body;

      const updated = await this.marketingService.updateTemplate(id, dto);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Plantilla de marketing actualizada correctamente.'
      });
    } catch (error: any) {
      if (error.message && error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la plantilla de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint DELETE /api/v1/marketing/templates/:id
   * Baja / desactivación de plantilla.
   */
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.marketingService.deleteTemplate(id);
      res.status(200).json({
        success: true,
        message: 'Plantilla desactivada correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al desactivar la plantilla de marketing.',
        details: error.message
      });
    }
  };

  // =========================================================================
  // ENDPOINTS DE CAMPAÑAS (/api/v1/marketing/campaigns)
  // =========================================================================

  /**
   * Endpoint GET /api/v1/marketing/campaigns
   * Listado de campañas de marketing WhatsApp.
   */
  getCampaigns = async (req: Request, res: Response): Promise<void> => {
    try {
      const campaigns = await this.marketingService.getCampaigns();
      res.status(200).json({
        success: true,
        total: campaigns.length,
        data: campaigns
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al consultar el listado de campañas.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint GET /api/v1/marketing/campaigns/:id
   * Detalle de una campaña por ID.
   */
  getCampaignById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const campaign = await this.marketingService.getCampaignById(id);
      res.status(200).json({
        success: true,
        data: campaign
      });
    } catch (error: any) {
      if (error.message && error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error al consultar los datos de la campaña.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint POST /api/v1/marketing/campaigns
   * Alta de nueva campaña de marketing WhatsApp.
   */
  createCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMarketingCampaignDTO = req.body;
      if (!dto.name || !dto.messageContent) {
        res.status(400).json({
          success: false,
          error: 'El nombre (name) y el contenido del mensaje (messageContent) son requeridos.'
        });
        return;
      }

      const campaign = await this.marketingService.createCampaign(dto);
      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaña de marketing creada exitosamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al crear la campaña de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint PUT /api/v1/marketing/campaigns/:id
   * Edición de campaña de marketing.
   */
  updateCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateMarketingCampaignDTO = req.body;

      const updated = await this.marketingService.updateCampaign(id, dto);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Campaña de marketing actualizada correctamente.'
      });
    } catch (error: any) {
      if (error.message && error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la campaña de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint POST /api/v1/marketing/campaigns/audience-preview
   * Previsualiza el tamaño y lista de clientes de un filtro de audiencia.
   */
  previewAudience = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: AudienceFilter = req.body;
      const preview = await this.marketingService.previewAudience(filter);

      res.status(200).json({
        success: true,
        totalTargeted: preview.count,
        targets: preview.targets,
        message: `La audiencia segmentada cuenta con ${preview.count} clientes elegibles.`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al calcular la previsualización de audiencia.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint POST /api/v1/marketing/campaigns/:id/send
   * Dispara la ejecución del envío masivo de la campaña por WhatsApp.
   */
  sendCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.marketingService.executeCampaign(id);

      res.status(200).json({
        success: true,
        data: result,
        message: `Envío masivo de campaña completado. Mensajes enviados: ${result.successfullySent}, Fallidos: ${result.failed}.`
      });
    } catch (error: any) {
      if (error.message && error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Error al ejecutar el envío de la campaña de marketing.',
        details: error.message
      });
    }
  };

  /**
   * Endpoint DELETE /api/v1/marketing/campaigns/:id
   * Elimina una campaña de marketing.
   */
  deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.marketingService.deleteCampaign(id);
      res.status(200).json({
        success: true,
        message: 'Campaña eliminada correctamente.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al eliminar la campaña.',
        details: error.message
      });
    }
  };
}
