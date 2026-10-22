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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  
  const isSubFamily = watch('isSubFamily') === 'true';

  // Safely extract array from API response
  const families: any[] = Array.isArray(rawFamiliesData) 
    ? rawFamiliesData 
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);

  const rootFamilies = families.filter((f: any) => !f.parentId);

  const generateCodeFromName = (nameStr: string, isSub?: boolean) => {
    const prefixType = isSub ? 'SUB' : 'FAM';
    if (!nameStr || !nameStr.trim()) return `${prefixType}-${Math.floor(100 + Math.random() * 900)}`;
    const clean = nameStr
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return clean.substring(0, 20) || `${prefixType}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const openModal = (family?: any, presetParentId?: string) => {
    if (family) {
      setEditingFamily(family);
      reset({
        isSubFamily: family.parentId ? 'true' : 'false',
        parentId: family.parentId || '',
        code: family.code || '',
        name: family.name || '',
        description: family.description || '',
        articleScope: family.articleScope || family.scope || 'ALL',
        sortOrder: family.sortOrder ?? 0,
      });
    } else if (presetParentId) {
      const parentFam = families.find((f: any) => f.id === presetParentId);
      const siblingCount = families.filter((f: any) => f.parentId === presetParentId).length;
      setEditingFamily(null);
      reset({
        isSubFamily: 'true',
        parentId: presetParentId,
        code: '',
        name: '',
        description: '',
        articleScope: parentFam?.articleScope || 'ALL',
        sortOrder: siblingCount + 1,
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
        sortOrder: rootFamilies.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFamily(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    const isSub = data.isSubFamily === 'true';
    const finalCode = data.code && data.code.trim()
      ? data.code.trim().toUpperCase()
      : generateCodeFromName(data.name, isSub);

    const payload = {
      parentId: isSub && data.parentId ? data.parentId : null,
      code: finalCode,
      name: (data.name || '').trim(),
      description: data.description || '',
      articleScope: data.articleScope || 'ALL',
      sortOrder: Number(data.sortOrder) || 0,
    };

    try {
      if (editingFamily) {
        await updateMutation.mutateAsync({ id: editingFamily.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar la familia.');
    }
  };

  const handleDelete = async (row: any) => {
    const subCount = families.filter((f: any) => f.parentId === row.id).length;
    const message = subCount > 0
      ? `¿Está seguro de que desea eliminar la familia "${row.name}" y sus ${subCount} sub-familia(s)?\nLos artículos asociados quedarán como "Sin familia".`
      : `¿Está seguro de que desea eliminar "${row.name}"?\nLos artículos asociados quedarán como "Sin familia".`;

    if (window.confirm(message)) {
      try {
        await deleteMutation.mutateAsync(row.id);
      } catch (err: any) {
        alert(err?.message || 'No se pudo eliminar la familia.');
      }
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
        return <span className="badge" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>Todos (MP y Productos)</span>;
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
        displayRows.push({ ...child, isRoot: false, parentName: root.name });
      });
    });

  // Catch any sub-families without an existing parent in rootFamilies
  const processedIds = new Set(displayRows.map(r => r.id));
  families.forEach((f: any) => {
    if (!processedIds.has(f.id)) {
      displayRows.push({ ...f, isRoot: !f.parentId });
    }
  });

  const nameRegister = register('name', {
    required: true,
    onChange: (e) => {
      if (!editingFamily) {
        const val = e.target.value;
        setValue('code', generateCodeFromName(val, isSubFamily), { shouldDirty: true });
      }
    }
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            <FolderTree size={28} />
            Familias y Sub-Familias de Artículos
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Estructura jerárquica de familias principales y sub-familias para Materias Primas y Productos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Nueva Familia / Sub-Familia
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
                <th style={{ padding: '12px 16px' }}>Nombre (Familia / Sub-familia)</th>
                <th style={{ padding: '12px 16px' }}>Alcance</th>
                <th style={{ padding: '12px 16px' }}>Jerarquía</th>
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
                displayRows.map((row) => {
                  const subCount = families.filter((f: any) => f.parentId === row.id).length;
                  return (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f3f4', 
                        backgroundColor: row.isRoot ? '#f8f9fa' : '#ffffff',
                        fontWeight: row.isRoot ? '600' : '400'
                      }}
                    >
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!row.isRoot && <ChevronRight size={16} style={{ color: '#5f6368', marginLeft: '20px' }} />}
                        {row.isRoot && <Layers size={16} style={{ color: '#2E5339' }} />}
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: row.isRoot ? '#1f2937' : '#6b7280' }}>
                          {row.code}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.isRoot ? (
                          <span style={{ color: '#111827', fontSize: '14px' }}>{row.name}</span>
                        ) : (
                          <span style={{ paddingLeft: '12px', color: '#374151', fontSize: '13.5px' }}>
                            — {row.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{renderScopeBadge(row.articleScope || row.scope)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.isRoot ? (
                          <span style={{ color: subCount > 0 ? '#2E5339' : '#9ca3af', fontSize: '13px', fontWeight: subCount > 0 ? 600 : 400 }}>
                            {subCount > 0 ? `${subCount} sub-familia(s)` : 'Sin sub-familias'}
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '12px' }}>
                            Sub-familia de <strong>{row.parentName || 'Principal'}</strong>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {row.isRoot && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => openModal(undefined, row.id)}
                              title={`Agregar sub-familia a ${row.name}`}
                              style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Plus size={13} /> Sub-familia
                            </button>
                          )}
                          <button 
                            type="button"
                            className="btn btn-sm btn-secondary" 
                            onClick={() => openModal(row)}
                            title="Modificar familia"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <Pencil size={15} style={{ color: '#2563EB', strokeWidth: 2.2 }} />
                          </button>
                          <button 
                            type="button"
                            className="btn btn-sm btn-secondary" 
                            onClick={() => handleDelete(row)}
                            title="Borrar familia"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <Trash2 size={15} style={{ color: '#DC2626', strokeWidth: 2.2 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFamily ? `✏️ Modificar ${editingFamily.parentId ? 'Sub-Familia' : 'Familia'}` : "➕ Nueva Familia / Sub-Familia"}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-field">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tipo de Clasificación</label>
            <select className="input" {...register('isSubFamily')} style={{ width: '100%' }}>
              <option value="false">Familia Principal</option>
              <option value="true">Sub-Familia (dependiente de una Familia Principal)</option>
            </select>
          </div>

          {isSubFamily && (
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Familia Principal (Padre) *</label>
              <select className="input" {...register('parentId', { required: isSubFamily })} style={{ width: '100%' }}>
                <option value="">Seleccione una familia principal...</option>
                {rootFamilies
                  .filter((f: any) => !editingFamily || f.id !== editingFamily.id)
                  .map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
              </select>
              {errors.parentId && <span style={{ color: '#d93025', fontSize: '12px' }}>Seleccione la familia principal</span>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nombre *</label>
              <input 
                type="text" 
                className="input" 
                {...nameRegister}
                style={{ width: '100%' }} 
                placeholder={isSubFamily ? "Ej. Mix de frutos secos" : "Ej. Frutos Secos"}
              />
              {errors.name && <span style={{ color: '#d93025', fontSize: '12px' }}>Este campo es requerido</span>}
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: '500' }}>Código</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentName = watch('name') || '';
                    const generated = generateCodeFromName(currentName, isSubFamily);
                    setValue('code', generated, { shouldDirty: true });
                  }}
                  style={{ background: 'none', border: 'none', color: '#2E5339', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ Auto
                </button>
              </div>
              <input 
                type="text" 
                className="input" 
                {...register('code')} 
                style={{ width: '100%' }} 
                placeholder="Auto-generado"
              />
            </div>
          </div>

          <div className="form-field">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Descripción</label>
            <textarea 
              className="input" 
              {...register('description')} 
              style={{ width: '100%', minHeight: '70px', resize: 'vertical' }} 
              placeholder="Descripción opcional de la familia o sub-familia..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Alcance</label>
              <select className="input" {...register('articleScope')} style={{ width: '100%' }}>
                <option value="ALL">Todos (Materia Prima y Producto Final)</option>
                <option value="RAW_MATERIAL">Solo Materia Prima</option>
                <option value="FINAL_PRODUCT">Solo Producto Final</option>
                <option value="PACKAGING">Solo Empaque</option>
              </select>
            </div>

            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Orden de visualización</label>
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
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingFamily ? 'Guardar Cambios' : 'Crear')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
