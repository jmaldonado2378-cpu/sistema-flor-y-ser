"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
class CustomerController {
    customerService;
    automationService;
    constructor(customerService, automationService) {
        this.customerService = customerService;
        this.automationService = automationService;
    }
    /**
     * Endpoint POST /api/v1/customers
     * Alta de un nuevo cliente en el CRM y disparo opcional de bienvenida.
     */
    create = async (req, res) => {
        try {
            const dto = req.body;
            if (!dto.firstName || !dto.lastName || !dto.phoneWhatsapp) {
                res.status(400).json({
                    success: false,
                    error: 'Los campos firstName, lastName y phoneWhatsapp son obligatorios.'
                });
                return;
            }
            const newCustomer = await this.customerService.createCustomer(dto);
            // Disparar automatización de bienvenida si la opción sendWelcome es true (o por defecto true)
            let welcomeLog = null;
            if (this.automationService && req.body.sendWelcome !== false) {
                try {
                    welcomeLog = await this.automationService.sendWelcomeMessage({ customerId: newCustomer.id });
                }
                catch {
                    // No interrumpe la creación del cliente si falla el envío del mensaje
                }
            }
            res.status(201).json({
                success: true,
                data: newCustomer,
                automationLog: welcomeLog,
                message: 'Cliente registrado exitosamente en el sistema CRM Flor y Ser.'
            });
        }
        catch (error) {
            if (error.message && error.message.includes('Ya existe un cliente')) {
                res.status(409).json({
                    success: false,
                    error: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor al registrar el cliente.',
                details: error.message
            });
        }
    };
    /**
     * Endpoint GET /api/v1/customers
     * Búsqueda y filtrado de clientes.
     */
    getAll = async (req, res) => {
        try {
            const filters = {
                search: req.query.search,
                channel: req.query.channel,
                dietaryProfileId: req.query.dietaryProfileId,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
            };
            const result = await this.customerService.searchCustomers(filters);
            res.status(200).json({
                success: true,
                total: result.total,
                data: result.customers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error al consultar el listado de clientes.',
                details: error.message
            });
        }
    };
    /**
     * Endpoint GET /api/v1/customers/:id/unified-profile
     * Consulta de la Ficha Unificada de Cliente.
     */
    getUnifiedProfile = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del cliente es requerido.'
                });
                return;
            }
            const profile = await this.customerService.getUnifiedProfile(id);
            res.status(200).json({
                success: true,
                data: profile
            });
        }
        catch (error) {
            if (error.message && error.message.includes('no encontrado')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Error al consultar la ficha unificada del cliente.',
                details: error.message
            });
        }
    };
    /**
     * Endpoint PUT /api/v1/customers/:id
     * Actualización de cliente.
     */
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const dto = req.body;
            const updated = await this.customerService.updateCustomer(id, dto);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Cliente actualizado correctamente.'
            });
        }
        catch (error) {
            if (error.message && error.message.includes('no encontrado')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Error al actualizar los datos del cliente.',
                details: error.message
            });
        }
    };
    /**
     * Endpoint DELETE /api/v1/customers/:id
     * Desactivación / baja lógica de cliente.
     */
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            await this.customerService.deleteCustomer(id);
            res.status(200).json({
                success: true,
                message: 'Cliente desactivado correctamente.'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error al desactivar el cliente.',
                details: error.message
            });
        }
    };
}
exports.CustomerController = CustomerController;
