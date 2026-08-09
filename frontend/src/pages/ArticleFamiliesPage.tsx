import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FolderTree, Plus, Pencil, Trash2, ChevronRight, Layers 
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { 
  useArticleFamilies, 
  useCreateArticleFamily, 
  useUpdateArticleFamily, 
  useDeleteArticleFamily 
} from '../hooks/useArticleFamilies';

export const ArticleFamiliesPage: React.FC<{onTabChange?: (tab: string) => void}> = () => {
  const { data: rawFamiliesData, isLoading, isError } = useArticleFamilies();
  const createMutation = useCreateArticleFamily();
  const updateMutation = useUpdateArticleFamily();
  const deleteMutation = useDeleteArticleFamily();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<any>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  const isSubFamily = watch('isSubFamily') === 'true';

  // Safely extract array from API response
  const families: any[] = Array.isArray(rawFamiliesData) 
    ? rawFamiliesData 
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);

  const rootFamilies = families.filter((f: any) => !f.parentId);

  const openModal = (family?: any) => {
    if (family) {
      setEditingFamily(family);
      reset({
        isSubFamily: family.parentId ? 'true' : 'false',
        parentId: family.parentId || '',
        code: family.code || '',
        name: family.name || '',
        description: family.description || '',
        articleScope: family.articleScope || family.scope || 'ALL',
        sortOrder: family.sortOrder || 0,
      });
    } else {
      setEditingFamily(null);
      reset({
        isSubFamily: 'false',
        parentId: '',
        code: '',
        name: '',
        description: '',
        articleScope: 'ALL',
        sortOrder: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFamily(null);
    reset();
  };

  const onSubmit = (data: any) => {
    const payload = {
      parentId: data.isSubFamily === 'true' && data.parentId ? data.parentId : null,
      code: data.code,
      name: data.name,
      description: data.description,
      articleScope: data.articleScope || 'ALL',
      sortOrder: Number(data.sortOrder) || 0,
    };

    if (editingFamily) {
      updateMutation.mutate({ id: editingFamily.id, data: payload }, {
        onSuccess: () => closeModal(),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => closeModal(),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta familia?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderScopeBadge = (scope?: string) => {
    switch (scope) {
      case 'RAW_MATERIAL':
        return <span className="badge" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>Materia Prima</span>;
      case 'FINAL_PRODUCT':
        return <span className="badge" style={{ backgroundColor: '#e8f0fe', color: '#1967d2' }}>Producto Final</span>;
      case 'PACKAGING':
        return <span className="badge" style={{ backgroundColor: '#fef7e0', color: '#b06000' }}>Empaque</span>;
      default:
        return <span className="badge" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>Todos</span>;
    }
  };

  // Organize for hierarchical display
  const displayRows: any[] = [];
  rootFamilies
    .slice()
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .forEach((root: any) => {
      displayRows.push({ ...root, isRoot: true });
      const children = families
        .filter((f: any) => f.parentId === root.id)
        .slice()
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      children.forEach((child: any) => {
        displayRows.push({ ...child, isRoot: false });
      });
    });

  // Catch any sub-families without an existing parent in rootFamilies
  const processedIds = new Set(displayRows.map(r => r.id));
  families.forEach((f: any) => {
    if (!processedIds.has(f.id)) {
      displayRows.push({ ...f, isRoot: !f.parentId });
    }
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold' }}>
          <FolderTree size={28} />
          Familias y Sub-Familias de Artículos
        </h1>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Nueva Familia
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Cargando familias...</div>
        ) : isError ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#d93025' }}>Error al cargar las familias.</div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Código</th>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Alcance</th>
                <th style={{ padding: '12px 16px' }}>Sub-familias</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>
                    No hay familias registradas.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => (
                  <tr 
                    key={row.id} 
                    style={{ 
                      borderBottom: '1px solid #f1f3f4', 
                      backgroundColor: row.isRoot ? '#f8f9fa' : 'transparent',
                      fontWeight: row.isRoot ? '600' : '400'
                    }}
                  >
                    <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!row.isRoot && <ChevronRight size={16} style={{ color: '#5f6368', marginLeft: '16px' }} />}
                      {row.isRoot && <Layers size={16} style={{ color: '#1a73e8' }} />}
                      {row.code}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{row.name}</td>
                    <td style={{ padding: '12px 16px' }}>{renderScopeBadge(row.articleScope || row.scope)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {row.isRoot ? (
                        <span style={{ color: '#5f6368' }}>
                          {families.filter((f: any) => f.parentId === row.id).length} sub-familia(s)
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => openModal(row)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleDelete(row.id)}
                          title="Eliminar"
                          style={{ color: '#d93025' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFamily ? "Editar Familia" : "Nueva Familia"}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-field">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tipo</label>
            <select className="input" {...register('isSubFamily')} style={{ width: '100%' }}>
              <option value="false">Familia Principal</option>
              <option value="true">Sub-Familia</option>
            </select>
          </div>

          {isSubFamily && (
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Familia Padre</label>
              <select className="input" {...register('parentId', { required: isSubFamily })} style={{ width: '100%' }}>
                <option value="">Seleccione una familia padre...</option>
                {rootFamilies.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
              {errors.parentId && <span style={{ color: '#d93025', fontSize: '12px' }}>Este campo es requerido</span>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Código</label>
              <input 
                type="text" 
                className="input" 
                {...register('code', { required: true })} 
                style={{ width: '100%' }} 
                placeholder="Ej. MAT-PRI"
              />
              {errors.code && <span style={{ color: '#d93025', fontSize: '12px' }}>Este campo es requerido</span>}
            </div>

            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nombre</label>
              <input 
                type="text" 
                className="input" 
                {...register('name', { required: true })} 
                style={{ width: '100%' }} 
                placeholder="Ej. Materias Primas"
              />
              {errors.name && <span style={{ color: '#d93025', fontSize: '12px' }}>Este campo es requerido</span>}
            </div>
          </div>

          <div className="form-field">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Descripción</label>
            <textarea 
              className="input" 
              {...register('description')} 
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} 
              placeholder="Descripción opcional de la familia..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Alcance</label>
              <select className="input" {...register('articleScope')} style={{ width: '100%' }}>
                <option value="ALL">Todos</option>
                <option value="RAW_MATERIAL">Materia Prima</option>
                <option value="FINAL_PRODUCT">Producto Final</option>
                <option value="PACKAGING">Empaque</option>
              </select>
            </div>

            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Orden</label>
              <input 
                type="number" 
                className="input" 
                {...register('sortOrder')} 
                style={{ width: '100%' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
