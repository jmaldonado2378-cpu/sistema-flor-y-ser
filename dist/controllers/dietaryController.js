"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DietaryController = void 0;
class DietaryController {
    dietaryService;
    constructor(dietaryService) {
        this.dietaryService = dietaryService;
    }
    /**
     * GET /api/v1/dietary-profiles
     * Obtiene todos los perfiles dietéticos activos.
     */
    getAll = async (req, res) => {
        try {
            const onlyActive = req.query.all !== 'true';
            const profiles = await this.dietaryService.getAllProfiles(onlyActive);
            res.status(200).json({ success: true, data: profiles });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Error al consultar catálogo de dietas.', details: error.message });
        }
    };
    /**
     * GET /api/v1/dietary-profiles/:id
     */
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const profile = await this.dietaryService.getProfileById(id);
            res.status(200).json({ success: true, data: profile });
        }
        catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    };
    /**
     * POST /api/v1/dietary-profiles
     * Crear nueva preferencia dietética dinámica.
     */
    create = async (req, res) => {
        try {
            const dto = req.body;
            if (!dto.name) {
                res.status(400).json({ success: false, error: 'El campo name es requerido para la preferencia dietética.' });
                return;
            }
            const newProfile = await this.dietaryService.createProfile(dto);
            res.status(201).json({ success: true, data: newProfile, message: 'Perfil dietético creado exitosamente.' });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    /**
     * PUT /api/v1/dietary-profiles/:id
     * Actualizar un perfil dietético existente.
     */
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const dto = req.body;
            const updated = await this.dietaryService.updateProfile(id, dto);
            res.status(200).json({ success: true, data: updated, message: 'Perfil dietético actualizado.' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * POST /api/v1/customers/:id/dietary-profiles
     * Asignar un perfil dietético a un cliente con observaciones personalizadas.
     */
    assignToCustomer = async (req, res) => {
        try {
            const { id } = req.params;
            const { dietaryProfileId, specificNotes } = req.body;
            if (!dietaryProfileId) {
                res.status(400).json({ success: false, error: 'El campo dietaryProfileId es requerido.' });
                return;
            }
            await this.dietaryService.assignToCustomer({
                customerId: id,
                dietaryProfileId,
                specificNotes
            });
            res.status(200).json({ success: true, message: 'Preferencia dietética asignada al cliente.' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * DELETE /api/v1/customers/:id/dietary-profiles/:profileId
     */
    removeFromCustomer = async (req, res) => {
        try {
            const { id, profileId } = req.params;
            await this.dietaryService.removeFromCustomer(id, profileId);
            res.status(200).json({ success: true, message: 'Preferencia dietética removida del cliente.' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.DietaryController = DietaryController;
