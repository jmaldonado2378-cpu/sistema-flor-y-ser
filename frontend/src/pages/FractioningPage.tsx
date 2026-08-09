import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator, Play, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  useFractioningHistory,
  usePreviewFractioning,
  useExecuteFractioning,
} from '../hooks/useFractioning';
import { useRawMaterials, useFinalProducts } from '../hooks/useInventory';
import { FractioningHistory, FractioningPreviewResponse } from '../api/fractioning';

const executeSchema = z.object({
  rawMaterialId: z.string().min(1, 'Seleccione una materia prima'),
  finalProductId: z.string().min(1, 'Seleccione un producto final'),
  inputQtyKg: z.number().min(0.01, 'Ingrese cantidad en Kg mayor a 0'),
  actualOutputUnits: z.number().min(1, 'Debe obtener al menos 1 unidad'),
  wasteReason: z.string().optional(),
  rawMaterialBatch: z.string().min(1, 'Ingrese lote de origen'),
  generatedBatch: z.string().min(1, 'Ingrese lote generado'),
  expirationDate: z.string().min(1, 'Seleccione fecha de vencimiento'),
  operatorName: z.string().min(1, 'Ingrese el nombre del operario'),
  notes: z.string().optional(),
});

type FractioningFormValues = z.infer<typeof executeSchema>;

export const FractioningPage: React.FC<{ onTabChange?: (tab: string) => void }> = () => {
  const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useFractioningHistory();
  const { data: rawMaterials } = useRawMaterials();
  const { data: finalProducts } = useFinalProducts();

  const previewMutation = usePreviewFractioning();
  const executeMutation = useExecuteFractioning();

  const [previewResult, setPreviewResult] = useState<FractioningPreviewResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FractioningFormValues>({
    resolver: zodResolver(executeSchema),
    defaultValues: {
      rawMaterialId: '',
      finalProductId: '',
      inputQtyKg: 10,
      actualOutputUnits: 0,
      wasteReason: 'Merma normal de envasado',
      rawMaterialBatch: 'LOT-MP-2026-08',
      generatedBatch: 'LOT-PF-2026-08',
      expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      operatorName: 'María Clara (Empaque)',
      notes: '',
    },
  });

  const watchedRawId = form.watch('rawMaterialId');
  const watchedFinalId = form.watch('finalProductId');
  const watchedInputKg = form.watch('inputQtyKg');

  const selectedRawMaterial = (rawMaterials || []).find(rm => rm.id === watchedRawId);

  // Filter final products matching selected raw material (by ID or Code)
  const matchingFinalProducts = (finalProducts || []).filter(fp => 
    !watchedRawId || fp.rawMaterialId === watchedRawId || fp.rawMaterialId === selectedRawMaterial?.code
  );

  // Fallback: If filtered list is empty, display all final products so dropdown is NEVER empty
  const availableFinalProducts = (matchingFinalProducts.length > 0) 
    ? matchingFinalProducts 
    : (finalProducts || []);

  const selectedFinalProduct = (finalProducts || []).find(fp => fp.id === watchedFinalId);

  const handlePreview = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!watchedRawId || !watchedFinalId || watchedInputKg <= 0) {
      setErrorMessage('Seleccione Materia Prima, Producto Final e ingrese la cantidad en Kg.');
      return;
    }

    try {
      const res = await previewMutation.mutateAsync({
        rawMaterialId: watchedRawId,
        finalProductId: watchedFinalId,
        inputQtyKg: watchedInputKg,
      });

      setPreviewResult(res);
      form.setValue('actualOutputUnits', res.expectedOutputUnits || res.targetUnits || 0);

      if (res.suggestedBatch) {
        form.setValue('generatedBatch', res.suggestedBatch);
      }
      if (res.suggestedExpirationDate) {
        form.setValue('expirationDate', res.suggestedExpirationDate);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al calcular simulación de fraccionado.');
    }
  };

  const onSubmit = (data: FractioningFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    executeMutation.mutate(data, {
      onSuccess: () => {
        setPreviewResult(null);
        setSuccessMessage('✅ Orden de fraccionamiento enviada al Kanban (Pendiente de Empaque). El stock se actualizará automáticamente al completarse la tarea en el Kanban.');
        refetchHistory();
      },
      onError: (err: any) => {
        setErrorMessage(err.message || 'Error al ejecutar fraccionamiento.');
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Fraccionamiento & Envasado</h1>
          <p className="text-sm text-text-muted mt-1">Simulación de rendimiento, control de mermas y registro de lotes de producción</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Fraccionamiento */}
        <div className="card">
          <div className="card-header mb-4">
            <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
              <Sparkles className="text-primary-sage" size={20} /> Nueva Orden de Fraccionamiento
            </h2>
          </div>

          {successMessage && (
            <div className="p-3 bg-green-50 text-green-800 text-sm rounded mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 text-terracotta text-sm rounded mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> {errorMessage}
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Sección 1: Selección de Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Materia Prima Base (Granel) *</label>
                <select 
                  className={`input ${form.formState.errors.rawMaterialId ? 'has-error' : ''}`}
                  {...form.register('rawMaterialId')}
                  onChange={(e) => {
                    form.setValue('rawMaterialId', e.target.value);
                    const rm = (rawMaterials || []).find(r => r.id === e.target.value);
                    const matchingFp = (finalProducts || []).find(fp => 
                      fp.rawMaterialId === e.target.value || fp.rawMaterialId === rm?.code
                    );
                    if (matchingFp) {
                      form.setValue('finalProductId', matchingFp.id);
                    }
                  }}
                >
                  <option value="">Seleccione materia prima...</option>
                  {(rawMaterials || []).map(rm => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.code}) - Stock: {rm.currentStock} {rm.unit}
                    </option>
                  ))}
                </select>
                {form.formState.errors.rawMaterialId && (
                  <span className="field-error">{form.formState.errors.rawMaterialId.message}</span>
                )}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Producto Elaborado Destino *</label>
                <select 
                  className={`input ${form.formState.errors.finalProductId ? 'has-error' : ''}`}
                  {...form.register('finalProductId')}
                >
                  <option value="">Seleccione producto final...</option>
                  {availableFinalProducts.map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.name} ({fp.code}) - {fp.unitWeightGrams}g
                    </option>
                  ))}
                </select>
                {form.formState.errors.finalProductId && (
                  <span className="field-error">{form.formState.errors.finalProductId.message}</span>
                )}
              </div>
            </div>

            {/* Sección 2: Cantidades y Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3">
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Insumo a Fraccionar (Kg) *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    className={`input ${form.formState.errors.inputQtyKg ? 'has-error' : ''}`}
                    {...form.register('inputQtyKg', { valueAsNumber: true })}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary flex items-center gap-1 text-xs"
                    onClick={handlePreview}
                    disabled={previewMutation.isPending}
                    title="Calcular unidades y merma sugerida"
                  >
                    <Calculator size={15} />
                    {previewMutation.isPending ? '...' : 'Simular'}
                  </button>
                </div>
                {form.formState.errors.inputQtyKg && (
                  <span className="field-error">{form.formState.errors.inputQtyKg.message}</span>
                )}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Unidades Obtenidas *</label>
                <input
                  type="number"
                  className={`input ${form.formState.errors.actualOutputUnits ? 'has-error' : ''}`}
                  {...form.register('actualOutputUnits', { valueAsNumber: true })}
                />
                {form.formState.errors.actualOutputUnits && (
                  <span className="field-error">{form.formState.errors.actualOutputUnits.message}</span>
                )}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Operario Responsable *</label>
                <input 
                  type="text"
                  className={`input ${form.formState.errors.operatorName ? 'has-error' : ''}`}
                  {...form.register('operatorName')}
                  placeholder="Operario responsable" 
                />
                {form.formState.errors.operatorName && (
                  <span className="field-error">{form.formState.errors.operatorName.message}</span>
                )}
              </div>
            </div>

            {/* Resultado de la simulación */}
            {previewResult && (
              <div className="p-3 bg-bg-linen rounded border border-primary-sage">
                <h3 className="font-bold text-primary-sage text-sm mb-1 flex items-center gap-1">
                  📊 Simulación Teórica de Rendimiento
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Unidades teóricas esperadas: <strong>{previewResult.expectedOutputUnits} un.</strong></div>
                  <div>Merma estimada: <strong>{previewResult.expectedWasteKg} kg ({previewResult.wastePercentage || 0}%)</strong></div>
                  {selectedFinalProduct && <div>Peso unitario: <strong>{selectedFinalProduct.unitWeightGrams} g</strong></div>}
                  {selectedRawMaterial && (
                    <div>Stock suficiente: <strong className={previewResult.hasSufficientStock ? 'text-primary-sage' : 'text-terracotta'}>
                      {previewResult.hasSufficientStock ? 'Sí' : 'Stock Insuficiente'}
                    </strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Sección 3: Lotes y Vencimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3">
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Lote Origen (MP) *</label>
                <input 
                  type="text"
                  className={`input ${form.formState.errors.rawMaterialBatch ? 'has-error' : ''}`}
                  {...form.register('rawMaterialBatch')}
                  placeholder="Ej: LOT-MP-2026-06"
                />
                {form.formState.errors.rawMaterialBatch && (
                  <span className="field-error">{form.formState.errors.rawMaterialBatch.message}</span>
                )}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Lote Generado (PF) *</label>
                <input 
                  type="text"
                  className={`input ${form.formState.errors.generatedBatch ? 'has-error' : ''}`}
                  {...form.register('generatedBatch')}
                  placeholder="Ej: LOT-202608-A"
                />
                {form.formState.errors.generatedBatch && (
                  <span className="field-error">{form.formState.errors.generatedBatch.message}</span>
                )}
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Fecha Vencimiento *</label>
                <input 
                  type="date" 
                  className={`input ${form.formState.errors.expirationDate ? 'has-error' : ''}`}
                  {...form.register('expirationDate')}
                />
                {form.formState.errors.expirationDate && (
                  <span className="field-error">{form.formState.errors.expirationDate.message}</span>
                )}
              </div>
            </div>

            {/* Sección 4: Observaciones */}
            <div className="grid grid-cols-1 gap-3 border-t pt-3">
              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Motivo de Merma (Opcional)</label>
                <input 
                  type="text"
                  className="input"
                  {...form.register('wasteReason')}
                  placeholder="Ej: Polvo de empaque y residuos de tolva"
                />
              </div>

              <div className="form-field">
                <label className="text-sm font-medium text-text-dark mb-1 block">Notas de la Orden</label>
                <textarea className="input" {...form.register('notes')} placeholder="Observaciones de calidad..." rows={2}></textarea>
              </div>
            </div>

            <div className="form-actions flex justify-end mt-4 border-t pt-4">
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={executeMutation.isPending}
              >
                <Play size={16} />
                {executeMutation.isPending ? 'Ejecutando...' : 'Ejecutar Orden de Fraccionado'}
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Fraccionamientos */}
        <div className="card">
          <div className="card-header mb-4">
            <h2 className="text-xl font-semibold text-text-dark">Últimos Fraccionamientos Registrados</h2>
          </div>
          
          {loadingHistory ? (
            <div className="py-8 text-center text-text-muted">Cargando historial de producción...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo Base</th>
                    <th>Producto Elaborado</th>
                    <th className="text-right">Kg</th>
                    <th className="text-right">Unidades</th>
                    <th>Operario</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(history) && history.map((item: FractioningHistory) => {
                    const rm = (rawMaterials || []).find(r => r.id === item.rawMaterialId || r.code === item.rawMaterialId);
                    const fp = (finalProducts || []).find(f => f.id === item.finalProductId || f.code === item.finalProductId);
                    
                    const dateStr = item.fractioningDate || item.date || item.createdAt;
                    const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('es-AR') : '-';
                    const rmDisplay = item.rawMaterialName || rm?.name || item.rawMaterialId;
                    const fpDisplay = item.finalProductName || fp?.name || item.finalProductId;

                    return (
                      <tr key={item.id}>
                        <td>{dateFormatted}</td>
                        <td className="font-medium text-xs">{rmDisplay}</td>
                        <td className="font-semibold text-primary-sage text-xs">{fpDisplay}</td>
                        <td className="text-right font-medium">{item.inputQtyKg} kg</td>
                        <td className="text-right font-bold text-text-dark">{item.actualOutputUnits} un.</td>
                        <td><span className="badge gray">{item.operatorName || 'Operario'}</span></td>
                      </tr>
                    );
                  })}
                  {(!history || history.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-text-muted">
                        No se registraron órdenes de fraccionamiento en el sistema
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
