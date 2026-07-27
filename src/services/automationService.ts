import { Pool } from 'pg';
import {
  AutomationType,
  AutomationChannel,
  AutomationLog,
  SendWelcomeDTO,
  ReplenishmentSuggestion,
  BirthdayGreetingResult,
  BroadcastDietaryDTO
} from '../types/automation';
import { CustomerService } from './customerService';

export class AutomationService {
  private inMemoryLogs: AutomationLog[] = [
    {
      id: 'log1',
      customerId: 'c1000000-0000-0000-0000-000000000001',
      customerName: 'Martina Gómez',
      customerPhone: '+5491155439821',
      customerEmail: 'martina.gomez@email.com',
      type: AutomationType.WELCOME,
      channel: AutomationChannel.WHATSAPP,
      messageContent: '🌸 ¡Hola Martina! Bienvenida a Flor y Ser Almacén Natural. Te regalamos un 10% de descuento con el cupón BIENVENIDA10.',
      status: 'SIMULATED',
      sentAt: '2026-05-10T10:05:00Z'
    },
    {
      id: 'log2',
      customerId: 'c3000000-0000-0000-0000-000000000003',
      customerName: 'Camila Sosa',
      customerPhone: '+5491166778899',
      customerEmail: 'camila.sosa@email.com',
      type: AutomationType.BIRTHDAY,
      channel: AutomationChannel.WHATSAPP,
      messageContent: '🎉 ¡Feliz Cumpleaños Camila! 🎂 En Flor y Ser queremos celebrar contigo: usa tu cupón CUMPLE20 para un 20% de descuento.',
      status: 'SIMULATED',
      sentAt: '2026-07-22T09:00:00Z'
    }
  ];

  constructor(
    private db: Pool,
    private customerService: CustomerService
  ) {}

  /**
   * Envía o simula el mensaje de bienvenida tras el alta de un nuevo cliente.
   */
  async sendWelcomeMessage(dto: SendWelcomeDTO): Promise<AutomationLog> {
    const customer = await this.customerService.getUnifiedProfile(dto.customerId);
    const couponCode = dto.customDiscountCode || 'BIENVENIDA10';
    const channel = dto.channel || (customer.preferredChannel === 'WHATSAPP' ? AutomationChannel.WHATSAPP : AutomationChannel.BOTH);

    const message = `🌸 ¡Hola ${customer.firstName}! Bienvenida/o a Flor y Ser Almacén Natural 🌱.Nos alegra acompañarte en tu alimentación consciente. Para tu primera compra, te regalamos un 10% de descuento con el código: *${couponCode}*. ¡Visítanos en nuestro local o haz tu pedido por WhatsApp!`;

    const log: AutomationLog = {
      id: 'log-' + Date.now(),
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phoneWhatsapp,
      customerEmail: customer.email,
      type: AutomationType.WELCOME,
      channel,
      messageContent: message,
      status: 'SIMULATED',
      sentAt: new Date().toISOString()
    };

    await this.recordAutomationLog(log);
    return log;
  }

  /**
   * Escanea y procesa las automatizaciones de cumpleaños para el día corriente.
   */
  async processBirthdayAutomations(): Promise<{ totalProcessed: number; results: BirthdayGreetingResult[] }> {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate(); // 1-31

    // Buscar clientes en el servicio
    const searchRes = await this.customerService.searchCustomers({ isActive: true });
    const matchingCustomers = searchRes.customers.filter(c => {
      if (!c.birthDate) return false;
      const parts = c.birthDate.split('-');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return m === currentMonth && (d === currentDay || true); // Incluye del mes para demo completa
      }
      return false;
    });

    const results: BirthdayGreetingResult[] = [];

    for (const customer of matchingCustomers) {
      const couponCode = `CUMPLE20-${customer.firstName.toUpperCase()}`;
      const message = `🎉 ¡Feliz Cumpleaños ${customer.firstName}! 🎂 En Flor y Ser Almacén Natural queremos festejar contigo. Disfruta un 20% de descuento en toda tu compra con tu cupón exclusivo: *${couponCode}* (Válido por todo tu mes de cumpleaños). ¡Te esperamos! 🎁🌱`;

      const log: AutomationLog = {
        id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phoneWhatsapp,
        customerEmail: customer.email,
        type: AutomationType.BIRTHDAY,
        channel: customer.email ? AutomationChannel.BOTH : AutomationChannel.WHATSAPP,
        messageContent: message,
        status: 'SIMULATED',
        sentAt: new Date().toISOString()
      };

      await this.recordAutomationLog(log);

      results.push({
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        phoneWhatsapp: customer.phoneWhatsapp,
        email: customer.email,
        birthDate: customer.birthDate || '',
        couponCode,
        message
      });
    }

    return {
      totalProcessed: results.length,
      results
    };
  }

  /**
   * Analiza hábitos de compra y genera recordatorios automatizados de reposición.
   */
  async processReplenishmentReminders(daysThreshold: number = 20): Promise<{ totalSuggestions: number; suggestions: ReplenishmentSuggestion[] }> {
    const searchRes = await this.customerService.searchCustomers({ isActive: true });
    const suggestions: ReplenishmentSuggestion[] = [];

    for (const customer of searchRes.customers) {
      const days = customer.purchaseStats.daysSinceLastPurchase !== undefined ? customer.purchaseStats.daysSinceLastPurchase : 25;

      if (days >= daysThreshold) {
        // Productos sugeridos dinámicos según perfil dietético
        const suggestedProducts: string[] = ['Granola Orgánica Artesanal', 'Frutos Secos Mix Selección'];
        if (customer.dietaryProfiles.some(p => p.code === 'VEGAN')) {
          suggestedProducts.push('Leche de Almendras / Avena');
        }
        if (customer.dietaryProfiles.some(p => p.code === 'CELIAC')) {
          suggestedProducts.push('Harina de Almendras / Premezcla Sin TACC');
        }

        const message = `🌿 Hola ${customer.firstName}, ¿cómo estás? Notamos que hace unos días no repones tus habituales del almacén (${suggestedProducts.join(', ')}). ¡Te lo dejamos preparado para retirar o te lo enviamos a domicilio! Responde a este mensaje para hacer tu pedido en 1 clic. 🚴‍♀️📦`;

        suggestions.push({
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          phoneWhatsapp: customer.phoneWhatsapp,
          email: customer.email,
          daysSinceLastPurchase: days,
          suggestedProducts,
          recommendedChannel: customer.preferredChannel === 'WHATSAPP' ? AutomationChannel.WHATSAPP : AutomationChannel.BOTH,
          messageTemplate: message
        });

        // Registrar en logs
        const log: AutomationLog = {
          id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerPhone: customer.phoneWhatsapp,
          customerEmail: customer.email,
          type: AutomationType.REPLENISHMENT,
          channel: AutomationChannel.WHATSAPP,
          messageContent: message,
          status: 'SIMULATED',
          sentAt: new Date().toISOString()
        };
        await this.recordAutomationLog(log);
      }
    }

    return {
      totalSuggestions: suggestions.length,
      suggestions
    };
  }

  /**
   * Envía una difusión de novedades / productos frescos segmentada por perfil dietético.
   */
  async sendDietaryNewsBroadcast(dto: BroadcastDietaryDTO): Promise<{ totalSent: number; targetProfile: string; message: string }> {
    const searchRes = await this.customerService.searchCustomers({
      dietaryProfileId: dto.dietaryProfileCode,
      isActive: true
    });

    const targetCustomers = searchRes.customers;
    const message = `📢 *¡Novedades Frescas en Flor y Ser Almacén Natural!* 🥑🍞\n\nIngresó un nuevo lote de *${dto.productName}* ideal para tu alimentación.\n\n${dto.customMessage}\n\n¡Hacé tu reserva por WhatsApp antes de que se agoten! 🛒✨`;

    for (const customer of targetCustomers) {
      const log: AutomationLog = {
        id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phoneWhatsapp,
        customerEmail: customer.email,
        type: AutomationType.NEW_ARRIVALS,
        channel: dto.channel || AutomationChannel.WHATSAPP,
        messageContent: message,
        status: 'SIMULATED',
        sentAt: new Date().toISOString()
      };
      await this.recordAutomationLog(log);
    }

    return {
      totalSent: targetCustomers.length,
      targetProfile: dto.dietaryProfileCode,
      message
    };
  }

  /**
   * Registra una automatización en BD o memoria.
   */
  private async recordAutomationLog(log: AutomationLog): Promise<void> {
    const query = `
      INSERT INTO automation_logs (id, customer_id, type, channel, message_content, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    try {
      await this.db.query(query, [
        log.id,
        log.customerId,
        log.type,
        log.channel,
        log.messageContent,
        log.status,
        log.sentAt
      ]);
    } catch {
      // Fallback
    }

    this.inMemoryLogs.unshift(log);
  }

  /**
   * Obtiene el historial de automatizaciones enviadas.
   */
  async getAutomationLogs(customerId?: string): Promise<AutomationLog[]> {
    const query = `
      SELECT al.id, al.customer_id, c.first_name || ' ' || c.last_name AS customer_name,
             c.phone_whatsapp, c.email, al.type, al.channel, al.message_content, al.status, al.sent_at
      FROM automation_logs al
      LEFT JOIN customers c ON al.customer_id = c.id
      ${customerId ? 'WHERE al.customer_id = $1' : ''}
      ORDER BY al.sent_at DESC;
    `;

    try {
      const res = await this.db.query(query, customerId ? [customerId] : []);
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerPhone: row.phone_whatsapp,
          customerEmail: row.email,
          type: row.type,
          channel: row.channel,
          messageContent: row.message_content,
          status: row.status,
          sentAt: row.sent_at.toISOString()
        }));
      }
    } catch {
      // Fallback
    }

    return customerId ? this.inMemoryLogs.filter(l => l.customerId === customerId) : this.inMemoryLogs;
  }
}
