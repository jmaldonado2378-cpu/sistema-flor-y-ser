import { Pool } from 'pg';
import {
  MarketingTemplate,
  CreateMarketingTemplateDTO,
  UpdateMarketingTemplateDTO,
  MarketingCampaignDTO,
  CreateMarketingCampaignDTO,
  UpdateMarketingCampaignDTO,
  AudienceFilter,
  CampaignExecutionResultDTO
} from '../types/marketing';
import { CustomerService } from './customerService';
import { UnifiedCustomerProfile } from '../types/customer';

/**
 * Servicio integral para WhatsApp Marketing: Gestión de Plantillas, Campañas Segmentadas y Envíos Masivos
 */
export class MarketingService {
  private inMemoryTemplates: MarketingTemplate[] = [
    {
      id: 'tmpl-10000000-0000-0000-0000-000000000001',
      title: 'Promoción Sin TACC y Celíacos',
      content: '¡Hola {nombre}! 🌾 Disfrutá un 15% OFF en toda nuestra línea de harinas puras y cereales Sin TACC este finde en Flor y Ser. Tienes {puntos} puntos acumulados.',
      category: 'PROMOTION',
      variables: ['{nombre}', '{puntos}'],
      isActive: true,
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'tmpl-20000000-0000-0000-0000-000000000002',
      title: 'Recordatorio de Reposición a Granel',
      content: 'Hola {nombre} 🌻 ¿Cómo venís con tus semillas, avena y frutos secos a granel? Hacé tu pedido por acá y retiralo sin demoras en el mostrador.',
      category: 'REPLENISHMENT',
      variables: ['{nombre}'],
      isActive: true,
      createdAt: '2026-07-05T12:00:00Z',
      updatedAt: '2026-07-05T12:00:00Z'
    },
    {
      id: 'tmpl-30000000-0000-0000-0000-000000000003',
      title: 'Novedades Veganas & Agroecológicas',
      content: '¡Hola {nombre}! 💚 Llegaron quesos de almendras y leches vegetales orgánicas de estación. ¡Hacé tu reserva antes de que se agoten!',
      category: 'NEWSLETTER',
      variables: ['{nombre}'],
      isActive: true,
      createdAt: '2026-07-10T09:30:00Z',
      updatedAt: '2026-07-10T09:30:00Z'
    }
  ];

  private inMemoryCampaigns: MarketingCampaignDTO[] = [
    {
      id: 'cmp-10000000-0000-0000-0000-000000000001',
      name: 'Campaña Especial Sin TACC Julio 2026',
      templateId: 'tmpl-10000000-0000-0000-0000-000000000001',
      messageContent: '¡Hola {nombre}! 🌾 Disfrutá un 15% OFF en toda nuestra línea de harinas puras y cereales Sin TACC este finde en Flor y Ser. Tienes {puntos} puntos acumulados.',
      audienceFilter: {
        dietaryProfileIds: ['CELIAC'],
        isActive: true
      },
      status: 'COMPLETED',
      recipientCount: 15,
      sentCount: 15,
      failedCount: 0,
      createdAt: '2026-07-15T14:00:00Z',
      updatedAt: '2026-07-15T14:05:00Z'
    },
    {
      id: 'cmp-20000000-0000-0000-0000-000000000002',
      name: 'Beneficio Clientes VIP y Frecuentes',
      templateId: 'tmpl-20000000-0000-0000-0000-000000000002',
      messageContent: 'Hola {nombre} 🌻 ¿Cómo venís con tus semillas, avena y frutos secos a granel? Hacé tu pedido por acá y retiralo sin demoras en el mostrador.',
      audienceFilter: {
        segment: 'VIP',
        isActive: true
      },
      status: 'SCHEDULED',
      scheduledAt: '2026-08-01T10:00:00Z',
      recipientCount: 8,
      sentCount: 0,
      failedCount: 0,
      createdAt: '2026-07-20T11:00:00Z',
      updatedAt: '2026-07-20T11:00:00Z'
    }
  ];

  private customerService: CustomerService;

  constructor(private db: Pool, customerService?: CustomerService) {
    this.customerService = customerService || new CustomerService(db);
  }

  // =========================================================================
  // GESTIÓN DE PLANTILLAS (TEMPLATES)
  // =========================================================================

  /**
   * Obtiene todas las plantillas activas o archivadas.
   */
  async getTemplates(): Promise<MarketingTemplate[]> {
    try {
      const query = `
        SELECT id, title, content, category, variables, is_active, created_at, updated_at
        FROM marketing_templates
        ORDER BY created_at DESC;
      `;
      const res = await this.db.query(query);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          variables: row.variables || [],
          isActive: row.is_active,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        }));
      }
    } catch {
      // Fallback a almacenamiento en memoria
    }

    return this.inMemoryTemplates;
  }

  /**
   * Obtiene una plantilla por su ID.
   */
  async getTemplateById(id: string): Promise<MarketingTemplate> {
    try {
      const query = `
        SELECT id, title, content, category, variables, is_active, created_at, updated_at
        FROM marketing_templates
        WHERE id = $1;
      `;
      const res = await this.db.query(query, [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          variables: row.variables || [],
          isActive: row.is_active,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      }
    } catch {
      // Fallback
    }

    const found = this.inMemoryTemplates.find(t => t.id === id);
    if (!found) {
      throw new Error(`Plantilla de marketing con ID ${id} no encontrada.`);
    }
    return found;
  }

  /**
   * Crea una nueva plantilla de marketing.
   */
  async createTemplate(dto: CreateMarketingTemplateDTO): Promise<MarketingTemplate> {
    if (!dto.title || !dto.content) {
      throw new Error('El título y el contenido de la plantilla son obligatorios.');
    }

    // Extraer variables automáticas del contenido entre llaves {variable}
    const detectedVariables = dto.variables || (dto.content.match(/\{[^}]+\}/g) || []);

    try {
      const query = `
        INSERT INTO marketing_templates (title, content, category, variables)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at, updated_at;
      `;
      const values = [
        dto.title.trim(),
        dto.content.trim(),
        dto.category || 'PROMOTION',
        detectedVariables
      ];

      const res = await this.db.query(query, values);
      const row = res.rows[0];

      return {
        id: row.id,
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category || 'PROMOTION',
        variables: detectedVariables,
        isActive: true,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    } catch {
      // Fallback en memoria
    }

    const newTemplate: MarketingTemplate = {
      id: 'tmpl-' + Date.now(),
      title: dto.title.trim(),
      content: dto.content.trim(),
      category: dto.category || 'PROMOTION',
      variables: detectedVariables,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryTemplates.unshift(newTemplate);
    return newTemplate;
  }

  /**
   * Actualiza una plantilla existente.
   */
  async updateTemplate(id: string, dto: UpdateMarketingTemplateDTO): Promise<MarketingTemplate> {
    const existing = await this.getTemplateById(id);

    const title = dto.title !== undefined ? dto.title.trim() : existing.title;
    const content = dto.content !== undefined ? dto.content.trim() : existing.content;
    const category = dto.category !== undefined ? dto.category : existing.category;
    const isActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;
    const variables = dto.variables || (content.match(/\{[^}]+\}/g) || []);

    try {
      const query = `
        UPDATE marketing_templates
        SET title = $1, content = $2, category = $3, variables = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6;
      `;
      await this.db.query(query, [title, content, category, variables, isActive, id]);
      return await this.getTemplateById(id);
    } catch {
      // Fallback
    }

    const index = this.inMemoryTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.inMemoryTemplates[index] = {
        ...this.inMemoryTemplates[index],
        title,
        content,
        category,
        variables,
        isActive,
        updatedAt: new Date().toISOString()
      };
      return this.inMemoryTemplates[index];
    }

    throw new Error(`Plantilla con ID ${id} no pudo ser actualizada.`);
  }

  /**
   * Elimina / Desactiva una plantilla.
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await this.db.query(`UPDATE marketing_templates SET is_active = FALSE WHERE id = $1;`, [id]);
    } catch {
      // Fallback
    }

    const index = this.inMemoryTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.inMemoryTemplates[index].isActive = false;
    }
  }

  // =========================================================================
  // GESTIÓN DE CAMPAÑAS Y AUDIENCIA (CAMPAIGNS)
  // =========================================================================

  /**
   * Obtiene la lista de campañas de marketing.
   */
  async getCampaigns(): Promise<MarketingCampaignDTO[]> {
    try {
      const query = `
        SELECT id, name, template_id, message_content, audience_filter, scheduled_at, status,
               recipient_count, sent_count, failed_count, created_at, updated_at
        FROM marketing_campaigns
        ORDER BY created_at DESC;
      `;
      const res = await this.db.query(query);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          templateId: row.template_id,
          messageContent: row.message_content,
          audienceFilter: row.audience_filter,
          scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : undefined,
          status: row.status,
          recipientCount: row.recipient_count,
          sentCount: row.sent_count,
          failedCount: row.failed_count,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        }));
      }
    } catch {
      // Fallback en memoria
    }

    return this.inMemoryCampaigns;
  }

  /**
   * Obtiene una campaña por su ID.
   */
  async getCampaignById(id: string): Promise<MarketingCampaignDTO> {
    try {
      const query = `
        SELECT id, name, template_id, message_content, audience_filter, scheduled_at, status,
               recipient_count, sent_count, failed_count, created_at, updated_at
        FROM marketing_campaigns
        WHERE id = $1;
      `;
      const res = await this.db.query(query, [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          templateId: row.template_id,
          messageContent: row.message_content,
          audienceFilter: row.audience_filter,
          scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : undefined,
          status: row.status,
          recipientCount: row.recipient_count,
          sentCount: row.sent_count,
          failedCount: row.failed_count,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString()
        };
      }
    } catch {
      // Fallback
    }

    const found = this.inMemoryCampaigns.find(c => c.id === id);
    if (!found) {
      throw new Error(`Campaña de marketing con ID ${id} no encontrada.`);
    }
    return found;
  }

  /**
   * Evalúa los filtros de audiencia y retorna los clientes coincidentes.
   */
  async getAudienceTargets(filter: AudienceFilter): Promise<UnifiedCustomerProfile[]> {
    const { customers } = await this.customerService.searchCustomers({ isActive: filter.isActive ?? true });

    return customers.filter(customer => {
      // Filtro por canal preferido
      if (filter.preferredChannel && customer.preferredChannel !== filter.preferredChannel) {
        return false;
      }

      // Filtro por segmento de cliente
      if (filter.segment && customer.segment !== filter.segment) {
        return false;
      }

      // Filtro por balance de puntos
      if (filter.minPoints !== undefined && customer.pointsBalance < filter.minPoints) {
        return false;
      }
      if (filter.maxPoints !== undefined && customer.pointsBalance > filter.maxPoints) {
        return false;
      }

      // Filtro por gasto acumulado
      if (filter.minSpent !== undefined && customer.purchaseStats.totalSpent < filter.minSpent) {
        return false;
      }
      if (filter.maxSpent !== undefined && customer.purchaseStats.totalSpent > filter.maxSpent) {
        return false;
      }

      // Filtro por perfiles dietéticos
      if (filter.dietaryProfileIds && filter.dietaryProfileIds.length > 0) {
        const hasMatchingDiet = customer.dietaryProfiles.some(dp => 
          filter.dietaryProfileIds!.includes(dp.id) || filter.dietaryProfileIds!.includes(dp.code)
        );
        if (!hasMatchingDiet) {
          return false;
        }
      }

      // Filtro por días sin compra
      if (filter.hasPurchasedDays !== undefined && customer.purchaseStats.daysSinceLastPurchase !== undefined) {
        if (customer.purchaseStats.daysSinceLastPurchase < filter.hasPurchasedDays) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Previsualiza la cantidad y lista de destinatarios según un AudienceFilter.
   */
  async previewAudience(filter: AudienceFilter): Promise<{ count: number; targets: UnifiedCustomerProfile[] }> {
    const targets = await this.getAudienceTargets(filter);
    return {
      count: targets.length,
      targets
    };
  }

  /**
   * Crea una nueva campaña de marketing en borrador o programada.
   */
  async createCampaign(dto: CreateMarketingCampaignDTO): Promise<MarketingCampaignDTO> {
    if (!dto.name || !dto.messageContent) {
      throw new Error('El nombre de la campaña y el contenido del mensaje son obligatorios.');
    }

    const { count } = await this.previewAudience(dto.audienceFilter || {});

    const status = dto.scheduledAt ? 'SCHEDULED' : 'DRAFT';

    try {
      const query = `
        INSERT INTO marketing_campaigns (
          name, template_id, message_content, audience_filter, scheduled_at, status, recipient_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at, updated_at;
      `;

      const values = [
        dto.name.trim(),
        dto.templateId || null,
        dto.messageContent.trim(),
        dto.audienceFilter || {},
        dto.scheduledAt || null,
        status,
        count
      ];

      const res = await this.db.query(query, values);
      const row = res.rows[0];

      return {
        id: row.id,
        name: dto.name.trim(),
        templateId: dto.templateId,
        messageContent: dto.messageContent.trim(),
        audienceFilter: dto.audienceFilter || {},
        scheduledAt: dto.scheduledAt,
        status,
        recipientCount: count,
        sentCount: 0,
        failedCount: 0,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    } catch {
      // Fallback
    }

    const newCampaign: MarketingCampaignDTO = {
      id: 'cmp-' + Date.now(),
      name: dto.name.trim(),
      templateId: dto.templateId,
      messageContent: dto.messageContent.trim(),
      audienceFilter: dto.audienceFilter || {},
      scheduledAt: dto.scheduledAt,
      status,
      recipientCount: count,
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryCampaigns.unshift(newCampaign);
    return newCampaign;
  }

  /**
   * Actualiza una campaña existente.
   */
  async updateCampaign(id: string, dto: UpdateMarketingCampaignDTO): Promise<MarketingCampaignDTO> {
    const existing = await this.getCampaignById(id);

    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const templateId = dto.templateId !== undefined ? dto.templateId : existing.templateId;
    const messageContent = dto.messageContent !== undefined ? dto.messageContent.trim() : existing.messageContent;
    const audienceFilter = dto.audienceFilter !== undefined ? dto.audienceFilter : existing.audienceFilter;
    const scheduledAt = dto.scheduledAt !== undefined ? dto.scheduledAt : existing.scheduledAt;
    const status = dto.status !== undefined ? dto.status : existing.status;

    const { count } = await this.previewAudience(audienceFilter);

    try {
      const query = `
        UPDATE marketing_campaigns
        SET name = $1, template_id = $2, message_content = $3, audience_filter = $4,
            scheduled_at = $5, status = $6, recipient_count = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8;
      `;
      await this.db.query(query, [name, templateId, messageContent, audienceFilter, scheduledAt || null, status, count, id]);
      return await this.getCampaignById(id);
    } catch {
      // Fallback
    }

    const index = this.inMemoryCampaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      this.inMemoryCampaigns[index] = {
        ...this.inMemoryCampaigns[index],
        name,
        templateId,
        messageContent,
        audienceFilter,
        scheduledAt,
        status,
        recipientCount: count,
        updatedAt: new Date().toISOString()
      };
      return this.inMemoryCampaigns[index];
    }

    throw new Error(`Campaña con ID ${id} no pudo ser actualizada.`);
  }

  /**
   * Ejecuta el envío masivo de una campaña a los destinatarios segmentados.
   */
  async executeCampaign(campaignId: string): Promise<CampaignExecutionResultDTO> {
    const campaign = await this.getCampaignById(campaignId);
    const targets = await this.getAudienceTargets(campaign.audienceFilter || {});

    const simulatedLogs: Array<{
      customerId: string;
      customerPhone: string;
      customerName: string;
      formattedMessage: string;
      status: 'SENT' | 'FAILED';
    }> = [];

    let successCount = 0;
    let failCount = 0;

    for (const customer of targets) {
      // Personalizar variables en el mensaje
      let formattedMsg = campaign.messageContent
        .replace(/\{nombre\}/g, customer.firstName)
        .replace(/\{apellido\}/g, customer.lastName)
        .replace(/\{puntos\}/g, customer.pointsBalance.toString())
        .replace(/\{canal\}/g, customer.preferredChannel);

      // Simulación de envío exitoso por la API WhatsApp Business / Webhooks
      const isSuccess = Boolean(customer.phoneWhatsapp);

      if (isSuccess) {
        successCount++;
        simulatedLogs.push({
          customerId: customer.id,
          customerPhone: customer.phoneWhatsapp,
          customerName: `${customer.firstName} ${customer.lastName}`,
          formattedMessage: formattedMsg,
          status: 'SENT'
        });

        // Registrar en tabla de automatizaciones
        try {
          await this.db.query(`
            INSERT INTO automation_logs (customer_id, type, channel, message_content, status)
            VALUES ($1, 'PROMOTION', 'WHATSAPP', $2, 'SENT');
          `, [customer.id, formattedMsg]);
        } catch {
          // Ignorar si BD no disponible
        }
      } else {
        failCount++;
        simulatedLogs.push({
          customerId: customer.id,
          customerPhone: customer.phoneWhatsapp || 'SIN_TELEFONO',
          customerName: `${customer.firstName} ${customer.lastName}`,
          formattedMessage: formattedMsg,
          status: 'FAILED'
        });
      }
    }

    // Actualizar estado de la campaña
    await this.updateCampaign(campaignId, {
      status: 'COMPLETED'
    });

    try {
      await this.db.query(`
        UPDATE marketing_campaigns
        SET sent_count = $1, failed_count = $2, status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
        WHERE id = $3;
      `, [successCount, failCount, campaignId]);
    } catch {
      // Fallback
    }

    const index = this.inMemoryCampaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      this.inMemoryCampaigns[index].sentCount = successCount;
      this.inMemoryCampaigns[index].failedCount = failCount;
      this.inMemoryCampaigns[index].status = 'COMPLETED';
    }

    return {
      campaignId,
      campaignName: campaign.name,
      totalTargeted: targets.length,
      successfullySent: successCount,
      failed: failCount,
      executedAt: new Date().toISOString(),
      simulatedLogs
    };
  }

  /**
   * Elimina una campaña de marketing.
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      await this.db.query(`DELETE FROM marketing_campaigns WHERE id = $1;`, [id]);
    } catch {
      // Fallback
    }

    const index = this.inMemoryCampaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      this.inMemoryCampaigns.splice(index, 1);
    }
  }
}
