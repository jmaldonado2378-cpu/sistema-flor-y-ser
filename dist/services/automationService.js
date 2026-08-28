"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const automation_1 = require("../types/automation");
class AutomationService {
    db;
    customerService;
    inMemoryLogs = [
        {
            id: 'log1',
            customerId: 'c1000000-0000-0000-0000-000000000001',
            customerName: 'Martina Gómez',
            customerPhone: '+5491155439821',
            customerEmail: 'martina.gomez@email.com',
            type: automation_1.AutomationType.WELCOME,
            channel: automation_1.AutomationChannel.WHATSAPP,
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
            type: automation_1.AutomationType.BIRTHDAY,
            channel: automation_1.AutomationChannel.WHATSAPP,
            messageContent: '🎉 ¡Feliz Cumpleaños Camila! 🎂 En Flor y Ser queremos celebrar contigo: usa tu cupón CUMPLE20 para un 20% de descuento.',
            status: 'SIMULATED',
            sentAt: '2026-07-22T09:00:00Z'
        }
    ];
    constructor(db, customerService) {
        this.db = db;
        this.customerService = customerService;
    }
    /**
     * Envía o simula el mensaje de bienvenida tras el alta de un nuevo cliente.
     */
    async sendWelcomeMessage(dto) {
        const customer = await this.customerService.getUnifiedProfile(dto.customerId);
        const couponCode = dto.customDiscountCode || 'BIENVENIDA10';
        const channel = dto.channel || (customer.preferredChannel === 'WHATSAPP' ? automation_1.AutomationChannel.WHATSAPP : automation_1.AutomationChannel.BOTH);
        const message = `🌸 ¡Hola ${customer.firstName}! Bienvenida/o a Flor y Ser Almacén Natural 🌱.Nos alegra acompañarte en tu alimentación consciente. Para tu primera compra, te regalamos un 10% de descuento con el código: *${couponCode}*. ¡Visítanos en nuestro local o haz tu pedido por WhatsApp!`;
        const log = {
            id: 'log-' + Date.now(),
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phoneWhatsapp,
            customerEmail: customer.email,
            type: automation_1.AutomationType.WELCOME,
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
    async processBirthdayAutomations() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate(); // 1-31
        // Buscar clientes en el servicio
        const searchRes = await this.customerService.searchCustomers({ isActive: true });
        const matchingCustomers = searchRes.customers.filter(c => {
            if (!c.birthDate)
                return false;
            const parts = c.birthDate.split('-');
            if (parts.length === 3) {
                const m = parseInt(parts[1], 10);
                const d = parseInt(parts[2], 10);
                return m === currentMonth && (d === currentDay || true); // Incluye del mes para demo completa
            }
            return false;
        });
        const results = [];
        for (const customer of matchingCustomers) {
            const couponCode = `CUMPLE20-${customer.firstName.toUpperCase()}`;
            const message = `🎉 ¡Feliz Cumpleaños ${customer.firstName}! 🎂 En Flor y Ser Almacén Natural queremos festejar contigo. Disfruta un 20% de descuento en toda tu compra con tu cupón exclusivo: *${couponCode}* (Válido por todo tu mes de cumpleaños). ¡Te esperamos! 🎁🌱`;
            const log = {
                id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phoneWhatsapp,
                customerEmail: customer.email,
                type: automation_1.AutomationType.BIRTHDAY,
                channel: customer.email ? automation_1.AutomationChannel.BOTH : automation_1.AutomationChannel.WHATSAPP,
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
    async processReplenishmentReminders(daysThreshold = 20) {
        const searchRes = await this.customerService.searchCustomers({ isActive: true });
        const suggestions = [];
        for (const customer of searchRes.customers) {
            const days = customer.purchaseStats.daysSinceLastPurchase !== undefined ? customer.purchaseStats.daysSinceLastPurchase : 25;
            if (days >= daysThreshold) {
                // Productos sugeridos dinámicos según perfil dietético
                const suggestedProducts = ['Granola Orgánica Artesanal', 'Frutos Secos Mix Selección'];
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
                    recommendedChannel: customer.preferredChannel === 'WHATSAPP' ? automation_1.AutomationChannel.WHATSAPP : automation_1.AutomationChannel.BOTH,
                    messageTemplate: message
                });
                // Registrar en logs
                const log = {
                    id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
                    customerId: customer.id,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerPhone: customer.phoneWhatsapp,
                    customerEmail: customer.email,
                    type: automation_1.AutomationType.REPLENISHMENT,
                    channel: automation_1.AutomationChannel.WHATSAPP,
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
    async sendDietaryNewsBroadcast(dto) {
        const searchRes = await this.customerService.searchCustomers({
            dietaryProfileId: dto.dietaryProfileCode,
            isActive: true
        });
        const targetCustomers = searchRes.customers;
        const message = `📢 *¡Novedades Frescas en Flor y Ser Almacén Natural!* 🥑🍞\n\nIngresó un nuevo lote de *${dto.productName}* ideal para tu alimentación.\n\n${dto.customMessage}\n\n¡Hacé tu reserva por WhatsApp antes de que se agoten! 🛒✨`;
        for (const customer of targetCustomers) {
            const log = {
                id: 'log-' + Date.now() + '-' + customer.id.slice(0, 4),
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phoneWhatsapp,
                customerEmail: customer.email,
                type: automation_1.AutomationType.NEW_ARRIVALS,
                channel: dto.channel || automation_1.AutomationChannel.WHATSAPP,
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
    async recordAutomationLog(log) {
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
        }
        catch {
            // Fallback
        }
        this.inMemoryLogs.unshift(log);
    }
    /**
     * Obtiene el historial de automatizaciones enviadas.
     */
    async getAutomationLogs(customerId) {
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
                return res.rows.map((row) => ({
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
        }
        catch {
            // Fallback
        }
        return customerId ? this.inMemoryLogs.filter(l => l.customerId === customerId) : this.inMemoryLogs;
    }
}
exports.AutomationService = AutomationService;
