import React from 'react';
import { useFinalProducts } from '../hooks/useLabels';
import { Printer, Package, Truck } from 'lucide-react';

interface LabelsPageProps {
  onTabChange?: (tab: string) => void;
}

export const LabelsPage: React.FC<LabelsPageProps> = () => {
  const { data: products, isLoading, isError } = useFinalProducts();

  if (isLoading) return <div className="py-8 text-center text-text-muted">Cargando...</div>;
  if (isError) return <div className="py-8 text-center text-terracotta">Error al cargar productos</div>;

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
          <Printer className="text-primary-sage" />
          Etiquetas
        </h1>
        <p className="text-md text-text-muted mt-2">
          Impresión de etiquetas de productos y envíos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-4 text-text-dark flex items-center gap-2">
            <Package /> Etiquetas de Producto
          </h2>
          <div className="form-field mb-4">
            <label>Seleccionar Producto</label>
            <select className="form-input">
              <option value="">Seleccione un producto...</option>
              {products?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary w-full">Imprimir Etiqueta Producto</button>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-4 text-text-dark flex items-center gap-2">
            <Truck /> Etiquetas de Envío
          </h2>
          <div className="form-field mb-4">
            <label>Nombre del Destinatario</label>
            <input type="text" className="form-input" placeholder="Nombre completo" />
          </div>
          <div className="form-field mb-4">
            <label>Dirección</label>
            <input type="text" className="form-input" placeholder="Dirección de envío" />
          </div>
          <button className="btn btn-secondary w-full">Imprimir Etiqueta de Envío</button>
        </div>
      </div>
    </div>
  );
};
