"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleFamilyController = void 0;
class ArticleFamilyController {
    articleFamilyService;
    constructor(articleFamilyService) {
        this.articleFamilyService = articleFamilyService;
    }
    getAll = async (req, res) => {
        try {
            const data = await this.articleFamilyService.getAll();
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    getByScope = async (req, res) => {
        try {
            const { scope } = req.params;
            const data = await this.articleFamilyService.getByScope(scope);
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const data = await this.articleFamilyService.getById(id);
            if (!data) {
                res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
                return;
            }
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    };
    create = async (req, res) => {
        try {
            const data = await this.articleFamilyService.create(req.body);
            res.status(201).json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const data = await this.articleFamilyService.update(id, req.body);
            if (!data) {
                res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
                return;
            }
            res.json({ status: 'SUCCESS', data });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const success = await this.articleFamilyService.delete(id);
            if (!success) {
                res.status(404).json({ status: 'ERROR', message: 'Familia de artículos no encontrada' });
                return;
            }
            res.json({ status: 'SUCCESS', message: 'Familia de artículos eliminada correctamente' });
        }
        catch (error) {
            res.status(400).json({ status: 'ERROR', message: error.message });
        }
    };
}
exports.ArticleFamilyController = ArticleFamilyController;
