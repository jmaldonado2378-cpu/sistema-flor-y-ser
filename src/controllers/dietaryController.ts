import { Request, Response } from 'express';
import { DietaryService } from '../services/dietaryService';
import { CreateDietaryProfileDTO, UpdateDietaryProfileDTO } from '../types/dietary';

export class DietaryController {
  constructor(private dietaryService: DietaryService) {}

  /**
   * GET /api/v1/dietary-profiles
   * Obtiene todos los perfiles dietéticos activos.
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const onlyActive = req.query.all !== 'true';
      const profiles = await this.dietaryService.getAllProfiles(onlyActive);
      res.status(200).json({ success: true, data: profiles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error al consultar catálogo de dietas.', details: error.message });
    }
  };

  /**
   * GET /api/v1/dietary-profiles/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const profile = await this.dietaryService.getProfileById(id);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  /**
   * POST /api/v1/dietary-profiles
   * Crear nueva preferencia dietética dinámica.
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateDietaryProfileDTO = req.body;
      if (!dto.name) {
        res.status(400).json({ success: false, error: 'El campo name es requerido para la preferencia dietética.' });
        return;
      }
      const newProfile = await this.dietaryService.createProfile(dto);
      res.status(201).json({ success: true, data: newProfile, message: 'Perfil dietético creado exitosamente.' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  /**
   * PUT /api/v1/dietary-profiles/:id
   * Actualizar un perfil dietético existente.
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateDietaryProfileDTO = req.body;
      const updated = await this.dietaryService.updateProfile(id, dto);
      res.status(200).json({ success: true, data: updated, message: 'Perfil dietético actualizado.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * POST /api/v1/customers/:id/dietary-profiles
   * Asignar un perfil dietético a un cliente con observaciones personalizadas.
   */
  assignToCustomer = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * DELETE /api/v1/customers/:id/dietary-profiles/:profileId
   */
  removeFromCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, profileId } = req.params;
      await this.dietaryService.removeFromCustomer(id, profileId);
      res.status(200).json({ success: true, message: 'Preferencia dietética removida del cliente.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
