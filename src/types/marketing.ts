/**
 * Tipos e interfaces para el Módulo de WhatsApp Marketing y Plantillas
 */

/**
 * Filtro de audiencia segmentada para campañas masivas de WhatsApp
 */
export interface AudienceFilter {
  preferredChannel?: string;       // Ej: 'WHATSAPP', 'LOCAL', 'ONLINE_STORE'
  dietaryProfileIds?: string[];    // IDs o códigos de perfiles (ej: ['VEGAN', 'CELIAC'])
  minPoints?: number;              // Mínimo balance de puntos de fidelización
  maxPoints?: number;              // Máximo balance de puntos
  minSpent?: number;               // Gasto acumulado mínimo ($)
  maxSpent?: number;               // Gasto acumulado máximo ($)
  segment?: string;                // Ej: 'VIP', 'FRECUENTE', 'MAYORISTA', 'OCASIONAL'
  isActive?: boolean;              // Filtrar solo clientes activos
  hasPurchasedDays?: number;       // Días transcurridos desde su última compra
}

/**
 * Categorías de Plantillas de Marketing
 */
export type MarketingTemplateCategory = 
  | 'PROMOTION'      // Promociones y Ofertas Especiales
  | 'NEWSLETTER'     // Novedades y Catálogo
  | 'SEASONAL'       // Efemérides y Fiestas
  | 'REPLENISHMENT'  // Recordatorio de Recompra
  | 'CUSTOM';        // Personalizada

/**
 * Plantilla de mensaje para WhatsApp Marketing
 */
export interface MarketingTemplate {
  id: string;
  title: string;
  content: string;
  category: MarketingTemplateCategory;
  variables?: string[];            // Ej: ['{nombre}', '{puntos}', '{descuento}']
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para la creación de una nueva plantilla de marketing
 */
export interface CreateMarketingTemplateDTO {
  title: string;
  content: string;
  category?: MarketingTemplateCategory;
  variables?: string[];
}

/**
 * DTO para la actualización de una plantilla de marketing
 */
export interface UpdateMarketingTemplateDTO {
  title?: string;
  content?: string;
  category?: MarketingTemplateCategory;
  variables?: string[];
  isActive?: boolean;
}

/**
 * Estado de ejecución de una campaña de marketing
 */
export type CampaignStatus = 
  | 'DRAFT'      // Borrador
  | 'SCHEDULED'  // Programada
  | 'SENDING'    // En proceso de envío
  | 'COMPLETED'  // Finalizada con éxito
  | 'CANCELLED'; // Cancelada

/**
 * DTO de Campaña de Marketing en WhatsApp
 */
export interface MarketingCampaignDTO {
  id?: string;
  name: string;
  templateId?: string;
  messageContent: string;
  audienceFilter: AudienceFilter;
  scheduledAt?: string;
  status?: CampaignStatus;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear una campaña de marketing
 */
export interface CreateMarketingCampaignDTO {
  name: string;
  templateId?: string;
  messageContent: string;
  audienceFilter: AudienceFilter;
  scheduledAt?: string;
}

/**
 * DTO para actualizar una campaña de marketing
 */
export interface UpdateMarketingCampaignDTO {
  name?: string;
  templateId?: string;
  messageContent?: string;
  audienceFilter?: AudienceFilter;
  scheduledAt?: string;
  status?: CampaignStatus;
}

/**
 * Detalle del resultado de ejecución de envío masivo de campaña
 */
export interface CampaignExecutionResultDTO {
  campaignId: string;
  campaignName: string;
  totalTargeted: number;
  successfullySent: number;
  failed: number;
  executedAt: string;
  simulatedLogs?: Array<{
    customerId: string;
    customerPhone: string;
    customerName: string;
    formattedMessage: string;
    status: 'SENT' | 'FAILED';
  }>;
}
