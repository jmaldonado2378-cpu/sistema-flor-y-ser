import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, UserPlus, Eye, Edit, Trash2, AlertCircle, Phone, Mail, MapPin, Calendar, Award, ShoppingBag, ShieldAlert } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks';
import { Customer, CreateCustomerDTO } from '../api/customers';

interface CustomersPageProps {
  onTabChange?: (tab: string) => void;
}

const DIETARY_OPTIONS = [
  { id: '10000000-0000-0000-0000-000000000001', code: 'VEGAN', name: 'Vegano' },
  { id: '10000000-0000-0000-0000-000000000002', code: 'CELIAC', name: 'Sin TACC / Celíaco' },
  { id: '10000000-0000-0000-0000-000000000003', code: 'ORGANIC', name: 'Orgánico / Agroecológico' },
  { id: '10000000-0000-0000-0000-000000000006', code: 'KETO', name: 'Dieta Keto' },
  { id: '10000000-0000-0000-0000-000000000004', code: 'DIABETIC', name: 'Apto Diabéticos' },
];

const customerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phoneWhatsapp: z.string().min(1, 'El teléfono WhatsApp es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  instagram: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  preferredChannel: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC<CustomersPageProps> = () => {
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');

  // Selected Dietary Profiles for Form
  const [selectedDietaryIds, setSelectedDietaryIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: customerResult, isLoading, isError, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      preferredChannel: 'LOCAL'
    }
  });

  const handleOpenCreateModal = () => {
    reset({
      firstName: '',
      lastName: '',
      phoneWhatsapp: '',
      email: '',
      instagram: '',
      address: '',
      birthDate: '',
      preferredChannel: 'LOCAL',
      notes: ''
    });
    setSelectedDietaryIds([]);
    setErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phoneWhatsapp: customer.phoneWhatsapp || '',
      email: customer.email || '',
      instagram: customer.instagram || '',
      address: customer.address || '',
      birthDate: customer.birthDate ? customer.birthDate.split('T')[0] : '',
      preferredChannel: customer.preferredChannel || 'LOCAL',
      notes: (customer as any).notes || ''
    });
    const currentDietIds = (customer.dietaryProfiles || []).map((p: any) => typeof p === 'string' ? p : p.id || p.code);
    setSelectedDietaryIds(currentDietIds);
    setErrorMessage(null);
  };

  const toggleDietaryProfile = (id: string) => {
    setSelectedDietaryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onSubmitCreate = (data: CustomerFormValues) => {
    setErrorMessage(null);
    const dto: CreateCustomerDTO & { dietaryProfileIds?: string[] } = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phoneWhatsapp: data.phoneWhatsapp.trim(),
      email: data.email?.trim() || undefined,
      instagram: data.instagram?.trim() || undefined,
      address: data.address?.trim() || undefined,
      birthDate: data.birthDate || undefined,
      preferredChannel: data.preferredChannel || 'LOCAL',
      notes: data.notes?.trim() || undefined,
      dietaryProfileIds: selectedDietaryIds
    };

    createCustomer.mutate(dto, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        reset();
      },
      onError: (err: any) => {
        setErrorMessage(err.message || 'Error al registrar el cliente. Verifique si el teléfono ya existe.');
      }
    });
  };

  const onSubmitEdit = (data: CustomerFormValues) => {
    if (!editingCustomer) return;
    setErrorMessage(null);

    const dto = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phoneWhatsapp: data.phoneWhatsapp.trim(),
      email: data.email?.trim() || undefined,
      instagram: data.instagram?.trim() || undefined,
      address: data.address?.trim() || undefined,
      birthDate: data.birthDate || undefined,
      preferredChannel: data.preferredChannel || 'LOCAL',
      notes: data.notes?.trim() || undefined,
      dietaryProfileIds: selectedDietaryIds
    };

    updateCustomer.mutate({ id: editingCustomer.id, data: dto }, {
      onSuccess: () => {
        setEditingCustomer(null);
        reset();
      },
      onError: (err: any) => {
        setErrorMessage(err.message || 'Error al actualizar el cliente.');
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    deleteCustomer.mutate(deletingCustomer.id, {
      onSuccess: () => {
        setDeletingCustomer(null);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const customers: Customer[] = customerResult?.data || [];

  // Filter customers by search term, channel, and dietary profile
  const filteredCustomers = customers.filter((c: Customer) => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const phone = (c.phoneWhatsapp || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || phone.includes(query) || email.includes(query);
    const matchesChannel = !channelFilter || c.preferredChannel === channelFilter;
    
    let matchesDietary = true;
    if (dietaryFilter) {
      matchesDietary = Array.isArray(c.dietaryProfiles) && c.dietaryProfiles.some((p: any) => {
        const code = typeof p === 'string' ? p : p.code || p.id;
        return code === dietaryFilter;
      });
    }

    return matchesSearch && matchesChannel && matchesDietary;
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Maestro de Clientes CRM</h1>
          <p className="text-sm text-text-muted mt-1">Gestión integral de ficha de cliente, hábitos dietéticos y saldos</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <UserPlus size={18} /> Nuevo Cliente
        </button>
      </header>

      <section className="card">
        {/* Filters bar */}
        <div className="flex gap-4 items-center mb-4 flex-wrap">
          <div className="flex-1" style={{ minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, WhatsApp o email..." 
              className="input"
              style={{ paddingLeft: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select 
              className="input" 
              style={{ width: '170px' }}
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="">Todos los Canales</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="LOCAL">Local / Mostrador</option>
              <option value="ONLINE_STORE">Tienda Online</option>
            </select>
            <select 
              className="input" 
              style={{ width: '190px' }}
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
            >
              <option value="">Perfil Dietético</option>
              <option value="VEGAN">Vegano</option>
              <option value="CELIAC">Sin TACC / Celíaco</option>
              <option value="ORGANIC">Orgánico</option>
              <option value="KETO">Keto</option>
              <option value="DIABETIC">Apto Diabéticos</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="py-8 text-center text-text-muted">Cargando catálogo CRM de clientes...</div>
        ) : isError ? (
          <div className="py-8 text-center text-terracotta">
            Error al conectar con la base de datos de clientes.{' '}
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Nombre y Apellido</th>
                  <th style={{ width: '25%' }}>Canal</th>
                  <th style={{ width: '20%' }}>Segmento</th>
                  <th style={{ width: '15%' }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td className="font-semibold text-text-dark">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td>
                      <span className="badge gray">
                        {customer.preferredChannel === 'WHATSAPP' ? '📱 WhatsApp' : customer.preferredChannel === 'ONLINE_STORE' ? '🌐 Online' : '🏪 Local'}
                      </span>
                    </td>
                    <td><span className="badge green">{customer.segment || 'FRECUENTE'}</span></td>
                    <td className="text-center">
                      <div className="flex gap-1 justify-center">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingCustomer(customer)}
                          title="Ver Ficha Unificada"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(customer)}
                          title="Editar Datos"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm text-terracotta"
                          onClick={() => setDeletingCustomer(customer)}
                          title="Desactivar Cliente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted">
                      No se encontraron clientes que coincidan con los filtros aplicados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Alta de Cliente */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="➕ Alta de Cliente CRM">
        <form onSubmit={handleSubmit(onSubmitCreate)} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-terracotta text-sm rounded flex items-center gap-2">
              <AlertCircle size={18} /> {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Nombre *</label>
              <input {...register('firstName')} placeholder="Ej: Martina" className={errors.firstName ? 'has-error' : ''} />
              {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
            </div>
            <div className="form-field">
              <label>Apellido *</label>
              <input {...register('lastName')} placeholder="Ej: Gómez" className={errors.lastName ? 'has-error' : ''} />
              {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
            </div>
          </div>
          
          <div className="form-field">
            <label>Teléfono WhatsApp *</label>
            <input {...register('phoneWhatsapp')} placeholder="+5491133445566" className={errors.phoneWhatsapp ? 'has-error' : ''} />
            {errors.phoneWhatsapp && <span className="field-error">{errors.phoneWhatsapp.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Correo Electrónico</label>
              <input {...register('email')} type="email" placeholder="cliente@email.com" className={errors.email ? 'has-error' : ''} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="form-field">
              <label>Instagram</label>
              <input {...register('instagram')} placeholder="@usuario" />
            </div>
          </div>

          <div className="form-field">
            <label>Dirección de Entrega</label>
            <input {...register('address')} placeholder="Av. Corrientes 1420, CABA" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Fecha de Nacimiento</label>
              <input {...register('birthDate')} type="date" />
            </div>
            <div className="form-field">
              <label>Canal Preferido</label>
              <select {...register('preferredChannel')}>
                <option value="LOCAL">Local / Mostrador</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="ONLINE_STORE">Tienda Online</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="font-semibold mb-2 block">Perfiles / Hábitos Dietéticos</label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map(diet => (
                <label key={diet.id} className="flex items-center gap-2 text-sm p-2 border rounded cursor-pointer hover:bg-linen">
                  <input 
                    type="checkbox"
                    checked={selectedDietaryIds.includes(diet.id)}
                    onChange={() => toggleDietaryProfile(diet.id)}
                  />
                  <span>{diet.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Notas Internas / Observaciones</label>
            <textarea {...register('notes')} placeholder="Preferencias de entrega, alergias, recomendaciones..." rows={2}></textarea>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Guardando...' : '✅ Registrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="✏️ Editar Cliente CRM">
        <form onSubmit={handleSubmit(onSubmitEdit)} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-terracotta text-sm rounded flex items-center gap-2">
              <AlertCircle size={18} /> {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Nombre *</label>
              <input {...register('firstName')} className={errors.firstName ? 'has-error' : ''} />
              {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
            </div>
            <div className="form-field">
              <label>Apellido *</label>
              <input {...register('lastName')} className={errors.lastName ? 'has-error' : ''} />
              {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
            </div>
          </div>
          
          <div className="form-field">
            <label>Teléfono WhatsApp *</label>
            <input {...register('phoneWhatsapp')} className={errors.phoneWhatsapp ? 'has-error' : ''} />
            {errors.phoneWhatsapp && <span className="field-error">{errors.phoneWhatsapp.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Correo Electrónico</label>
              <input {...register('email')} type="email" className={errors.email ? 'has-error' : ''} />
            </div>
            <div className="form-field">
              <label>Instagram</label>
              <input {...register('instagram')} />
            </div>
          </div>

          <div className="form-field">
            <label>Dirección de Entrega</label>
            <input {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Fecha de Nacimiento</label>
              <input {...register('birthDate')} type="date" />
            </div>
            <div className="form-field">
              <label>Canal Preferido</label>
              <select {...register('preferredChannel')}>
                <option value="LOCAL">Local / Mostrador</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="ONLINE_STORE">Tienda Online</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="font-semibold mb-2 block">Perfiles / Hábitos Dietéticos</label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map(diet => (
                <label key={diet.id} className="flex items-center gap-2 text-sm p-2 border rounded cursor-pointer hover:bg-linen">
                  <input 
                    type="checkbox"
                    checked={selectedDietaryIds.includes(diet.id)}
                    onChange={() => toggleDietaryProfile(diet.id)}
                  />
                  <span>{diet.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Notas Internas</label>
            <textarea {...register('notes')} rows={2}></textarea>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingCustomer(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ficha Unificada / Detalle de Cliente */}
      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="👤 Ficha Unificada de Cliente" maxWidth="620px">
        {viewingCustomer && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-text-dark">{viewingCustomer.firstName} {viewingCustomer.lastName}</h2>
                <span className="badge green mt-1">{viewingCustomer.segment || 'FRECUENTE'}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-muted">Puntos de Fidelización</div>
                <div className="text-xl font-bold text-primary-sage"><Award size={18} /> {viewingCustomer.points || 0} pts</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Phone size={16} className="text-primary-sage" /> <span>{viewingCustomer.phoneWhatsapp}</span></div>
              <div className="flex items-center gap-2"><Mail size={16} className="text-primary-sage" /> <span>{viewingCustomer.email || 'Sin correo registrado'}</span></div>
              <div className="flex items-center gap-2"><MapPin size={16} className="text-primary-sage" /> <span>{viewingCustomer.address || 'Sin dirección registrada'}</span></div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-primary-sage" /> <span>Nac: {viewingCustomer.birthDate || 'No informada'}</span></div>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-semibold text-sm mb-2">Hábitos y Perfiles Dietéticos:</h4>
              <div className="flex gap-2 flex-wrap">
                {Array.isArray(viewingCustomer.dietaryProfiles) && viewingCustomer.dietaryProfiles.length > 0 ? (
                  viewingCustomer.dietaryProfiles.map((p: any) => (
                    <span key={typeof p === 'string' ? p : p.id || p.code} className="diet-tag">
                      {typeof p === 'string' ? p : p.name || p.code}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted">Sin preferencias dietéticas especificadas</span>
                )}
              </div>
            </div>

            {(viewingCustomer as any).notes && (
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-1">Notas Internas:</h4>
                <p className="text-sm text-text-dark bg-bg-linen p-3 rounded">{(viewingCustomer as any).notes}</p>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between items-center text-sm">
              <div>
                <span className="text-text-muted">Saldo Cta Cte: </span>
                <span className="font-bold">{formatCurrency(viewingCustomer.accountBalance || 0)}</span>
              </div>
              <button className="btn btn-secondary" onClick={() => setViewingCustomer(null)}>Cerrar Ficha</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Desactivación */}
      <Modal isOpen={!!deletingCustomer} onClose={() => setDeletingCustomer(null)} title="⚠️ Confirmar Desactivación">
        {deletingCustomer && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-terracotta bg-red-50 p-3 rounded">
              <ShieldAlert size={24} />
              <p className="text-sm">¿Está seguro que desea desactivar al cliente <strong>{deletingCustomer.firstName} {deletingCustomer.lastName}</strong>? El cliente pasará a estado inactivo.</p>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button className="btn btn-secondary" onClick={() => setDeletingCustomer(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--terracotta)' }} onClick={handleDeleteConfirm} disabled={deleteCustomer.isPending}>
                {deleteCustomer.isPending ? 'Desactivando...' : 'Sí, Desactivar Cliente'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
