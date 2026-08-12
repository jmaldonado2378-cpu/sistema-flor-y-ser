import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { 
  useSettings, 
  useUpdateBusinessInfo, 
  useUpdatePrintSettings, 
  useUpdateCommissions,
  useUpdateHelpSettings 
} from '../hooks/useSettings';
import { Settings, Save, Store, Printer, Percent, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, Trash2, HelpCircle } from 'lucide-react';

interface SettingsPageProps {
  onTabChange?: (tab: string) => void;
}

// Transform Google Drive viewer URLs into direct image URLs
const normalizeLogoUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Pattern: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Pattern: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  return trimmed;
};

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateBusiness = useUpdateBusinessInfo();
  const updatePrint = useUpdatePrintSettings();
  const updateComm = useUpdateCommissions();
  const updateHelp = useUpdateHelpSettings();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [businessMsg, setBusinessMsg] = useState<string | null>(null);
  const [printMsg, setPrintMsg] = useState<string | null>(null);
  const [commMsg, setCommMsg] = useState<string | null>(null);
  const [helpMsg, setHelpMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const businessForm = useForm({
    defaultValues: {
      name: 'Flor y Ser Almacén Natural',
      cuit: '30-71689452-9',
      whatsapp: '+5491155439821',
      address: 'Av. Corrientes 3421, CABA, Argentina',
      logoUrl: ''
    }
  });

  const printForm = useForm({
    defaultValues: {
      defaultPrinter: 'NIIMBOT B1 Pro (Mostrador)',
      dpi: 203
    }
  });

  const commForm = useForm({
    defaultValues: {
      mostrador: 0,
      whatsapp: 2.5,
      tiendaOnline: 5.0,
      mercadoPago: 4.5,
      tarjetas: 3.5
    }
  });

  const helpForm = useForm({
    defaultValues: {
      supportEmail: 'soporte@floryser.com.ar',
      supportPhone: '+54 9 11 5543-9821',
      posGuide: 'Registre ventas en mostrador, aplique descuentos y gestione el ticket.',
      rawGuide: 'Asigne la familia correspondiente a cada insumo o granel.',
      permGuide: 'Configure el acceso a Kanban de Tareas por cada usuario vendedor.'
    }
  });

  useEffect(() => {
    if (settings) {
      if (settings.businessInfo) {
        businessForm.reset({
          name: settings.businessInfo.name || 'Flor y Ser Almacén Natural',
          cuit: settings.businessInfo.cuit || '',
          whatsapp: settings.businessInfo.whatsapp || '',
          address: settings.businessInfo.address || '',
          logoUrl: settings.businessInfo.logoUrl || ''
        });
      }
      if (settings.printSettings) {
        printForm.reset({
          defaultPrinter: settings.printSettings.defaultPrinter || 'NIIMBOT B1 Pro (Mostrador)',
          dpi: settings.printSettings.dpi || 203
        });
      }
      if (settings.channelCommissions) {
        commForm.reset({
          mostrador: settings.channelCommissions.mostrador ?? 0,
          whatsapp: settings.channelCommissions.whatsapp ?? 2.5,
          tiendaOnline: settings.channelCommissions.tiendaOnline ?? 5.0,
          mercadoPago: settings.channelCommissions.mercadoPago ?? 4.5,
          tarjetas: settings.channelCommissions.tarjetas ?? 3.5
        });
      }
      if (settings.helpSettings) {
        helpForm.reset({
          supportEmail: settings.helpSettings.supportEmail || 'soporte@floryser.com.ar',
          supportPhone: settings.helpSettings.supportPhone || '+54 9 11 5543-9821',
          posGuide: settings.helpSettings.posGuide || 'Registre ventas en mostrador, aplique descuentos y gestione el ticket.',
          rawGuide: settings.helpSettings.rawGuide || 'Asigne la familia correspondiente a cada insumo o granel.',
          permGuide: settings.helpSettings.permGuide || 'Configure el acceso a Kanban de Tareas por cada usuario vendedor.'
        });
      }
    }
  }, [settings]);

  const watchedLogoUrl = businessForm.watch('logoUrl');
  const previewLogoUrl = normalizeLogoUrl(watchedLogoUrl);

  const handleLogoInputChange = (rawVal: string) => {
    setLogoLoadError(false);
    const normalized = normalizeLogoUrl(rawVal);
    businessForm.setValue('logoUrl', normalized, { shouldValidate: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoLoadError(false);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png');
          businessForm.setValue('logoUrl', compressedDataUrl, { shouldValidate: true });
        };
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    businessForm.setValue('logoUrl', '', { shouldValidate: true });
    setLogoLoadError(false);
  };

  const onBusinessSubmit = (data: any) => {
    setBusinessMsg(null);
    setErrorMsg(null);

    const payload = {
      ...data,
      logoUrl: normalizeLogoUrl(data.logoUrl)
    };

    updateBusiness.mutate(payload, {
      onSuccess: () => {
        setBusinessMsg('✅ Información comercial y logo del negocio actualizados correctamente.');
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar información del negocio.');
      }
    });
  };

  const onPrintSubmit = (data: any) => {
    setPrintMsg(null);
    setErrorMsg(null);
    updatePrint.mutate({ ...data, dpi: Number(data.dpi) }, {
      onSuccess: () => {
        setPrintMsg('✅ Ajustes de impresión y etiquetas guardados correctamente.');
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar ajustes de impresión.');
      }
    });
  };

  const onCommSubmit = (data: any) => {
    setCommMsg(null);
    setErrorMsg(null);
    const formatted = {
      mostrador: Number(data.mostrador),
      whatsapp: Number(data.whatsapp),
      tiendaOnline: Number(data.tiendaOnline),
      mercadoPago: Number(data.mercadoPago),
      tarjetas: Number(data.tarjetas)
    };
    updateComm.mutate(formatted, {
      onSuccess: () => {
        setCommMsg('✅ Estructura de comisiones por canal guardada correctamente.');
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar comisiones por canal.');
      }
    });
  };

  const onHelpSubmit = (data: any) => {
    setHelpMsg(null);
    setErrorMsg(null);
    updateHelp.mutate(data, {
      onSuccess: () => {
        setHelpMsg('✅ Información del Centro de Ayuda & Soporte actualizada correctamente.');
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar datos del Centro de Ayuda.');
      }
    });
  };

  if (isLoading) return <div className="py-8 text-center text-text-muted">Cargando configuración general del sistema...</div>;
  if (isError) return (
    <div className="py-8 text-center text-terracotta">
      Error al cargar configuración del sistema.{' '}
      <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <Settings className="text-primary-sage" />
            Configuración del Sistema
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Parámetros comerciales, comisiones y opciones avanzadas de impresión
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-terracotta text-sm rounded mb-4 flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      <div className="grid gap-6">
        {/* Seccion 1: Datos del Negocio */}
        <div className="card p-5">
          <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)}>
            <div className="card-header flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-dark flex items-center gap-2">
                <Store size={20} className="text-primary-sage" />
                Información del Negocio & Datos Fiscales
              </h2>
              <button type="submit" className="btn btn-sm btn-primary flex items-center gap-2" disabled={updateBusiness.isPending}>
                <Save size={16} /> {updateBusiness.isPending ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>

            {businessMsg && (
              <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> {businessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Nombre Comercial / Sucursal *</label>
                <input type="text" className="input" {...businessForm.register('name')} placeholder="Nombre de la marca o local" />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">CUIT / Identificación Fiscal</label>
                <input type="text" className="input" {...businessForm.register('cuit')} placeholder="Ej: 30-71689452-9" />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Teléfono WhatsApp de Ventas</label>
                <input type="text" className="input" {...businessForm.register('whatsapp')} placeholder="Ej: +5491155439821" />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Dirección Física del Local / Depósito</label>
                <input type="text" className="input" {...businessForm.register('address')} placeholder="Dirección completa" />
              </div>

              {/* Campo Logo con Dropzone / Subida Directa */}
              <div className="form-field md:col-span-2">
                <label className="text-xs font-semibold text-text-dark mb-1 block">
                  🖼️ Logo de la Marca / Negocio
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-bg-linen p-3 rounded border">
                  {previewLogoUrl && !logoLoadError ? (
                    <div className="w-20 h-20 rounded border p-1 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm relative group">
                      <img 
                        src={previewLogoUrl} 
                        alt="Logo Negocio" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoLoadError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded border bg-white flex flex-col items-center justify-center text-text-muted text-[10px] text-center flex-shrink-0 p-1 border-dashed">
                      <ImageIcon size={22} className="mb-1 text-primary-sage" />
                      Sin logo
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full">
                      <input 
                        type="text" 
                        className="input text-xs flex-1"
                        {...businessForm.register('logoUrl')}
                        onBlur={(e) => handleLogoInputChange(e.target.value)}
                        placeholder="Pegar enlace directo de imagen o enlace compartido..." 
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary text-xs flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Upload size={14} /> Seleccionar Archivo PC
                      </button>

                      {previewLogoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="btn btn-secondary text-xs text-terracotta flex items-center gap-1 flex-shrink-0"
                          title="Quitar logo"
                        >
                          <Trash2 size={14} /> Quitar
                        </button>
                      )}
                    </div>

                    {logoLoadError && (
                      <p className="text-xs text-terracotta font-medium flex items-center gap-1">
                        <AlertCircle size={14} /> La URL ingresada no permitió cargar la imagen (verifique los permisos o use "Seleccionar Archivo PC").
                      </p>
                    )}

                    <p className="text-[11px] text-text-muted">
                      💡 <strong>Recomendado:</strong> Presione <strong>"Seleccionar Archivo PC"</strong> para elegir cualquier imagen (.png, .jpg, .svg) directamente desde su computadora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Seccion 2: Impresion */}
        <div className="card p-5">
          <form onSubmit={printForm.handleSubmit(onPrintSubmit)}>
            <div className="card-header flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-dark flex items-center gap-2">
                <Printer size={20} className="text-primary-sage" />
                Ajustes de Impresión & Impresora Térmica
              </h2>
              <button type="submit" className="btn btn-sm btn-primary flex items-center gap-2" disabled={updatePrint.isPending}>
                <Save size={16} /> {updatePrint.isPending ? 'Guardando...' : 'Guardar Ajustes'}
              </button>
            </div>

            {printMsg && (
              <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> {printMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Impresora por Defecto para Etiquetas</label>
                <select className="input" {...printForm.register('defaultPrinter')}>
                  <option value="NIIMBOT B1 Pro (Mostrador)">NIIMBOT B1 Pro (Mostrador / Térmica Directa)</option>
                  <option value="ZEBRA ZD420 (Depósito)">ZEBRA ZD420 (Depósito Central)</option>
                  <option value="Impresora Térmica 80mm">Impresora Térmica Estándar 80mm</option>
                  <option value="PDF A4 (Planilla Etiquetas)">Generar PDF A4 (Planilla Etiquetas)</option>
                </select>
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Resolución de Impresión (DPI)</label>
                <select className="input" {...printForm.register('dpi')}>
                  <option value="203">203 DPI (Térmica Estándar)</option>
                  <option value="300">300 DPI (Alta Definición)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Seccion 3: Comisiones */}
        <div className="card p-5">
          <form onSubmit={commForm.handleSubmit(onCommSubmit)}>
            <div className="card-header flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-dark flex items-center gap-2">
                <Percent size={20} className="text-primary-sage" />
                Estructura de Comisiones por Canal de Venta (%)
              </h2>
              <button type="submit" className="btn btn-sm btn-primary flex items-center gap-2" disabled={updateComm.isPending}>
                <Save size={16} /> {updateComm.isPending ? 'Guardando...' : 'Guardar Comisiones'}
              </button>
            </div>

            {commMsg && (
              <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> {commMsg}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Mostrador / Local (%)</label>
                <input type="number" step="0.1" className="input" {...commForm.register('mostrador')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">WhatsApp / Chat (%)</label>
                <input type="number" step="0.1" className="input" {...commForm.register('whatsapp')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Tienda Online (%)</label>
                <input type="number" step="0.1" className="input" {...commForm.register('tiendaOnline')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Mercado Pago / QR (%)</label>
                <input type="number" step="0.1" className="input" {...commForm.register('mercadoPago')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Tarjetas Débito / Crédito (%)</label>
                <input type="number" step="0.1" className="input" {...commForm.register('tarjetas')} />
              </div>
            </div>
          </form>
        </div>

        {/* Card 4: Centro de Ayuda & Soporte Técnico */}
        <div className="card p-5">
          <form onSubmit={helpForm.handleSubmit(onHelpSubmit)}>
            <div className="card-header flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-dark flex items-center gap-2">
                <HelpCircle size={20} className="text-primary-sage" />
                Centro de Ayuda & Soporte Técnico (Desplegable Barra Superior)
              </h2>
              <button type="submit" className="btn btn-sm btn-primary flex items-center gap-2" disabled={updateHelp.isPending}>
                <Save size={16} /> {updateHelp.isPending ? 'Guardando...' : 'Guardar Datos de Ayuda'}
              </button>
            </div>

            {helpMsg && (
              <div className="p-2.5 bg-green-50 text-green-800 text-xs rounded mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> {helpMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Email de Soporte Técnico</label>
                <input type="email" className="input" {...helpForm.register('supportEmail')} placeholder="soporte@floryser.com.ar" />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">Teléfono / WhatsApp de Soporte</label>
                <input className="input" {...helpForm.register('supportPhone')} placeholder="+54 9 11 5543-9821" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">🌿 Guía Rápida: Punto de Venta</label>
                <input className="input" {...helpForm.register('posGuide')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">📦 Guía Rápida: Materia Prima & Familias</label>
                <input className="input" {...helpForm.register('rawGuide')} />
              </div>

              <div className="form-field">
                <label className="text-xs font-medium text-text-dark mb-1 block">🔒 Guía Rápida: Permisos y Usuarios</label>
                <input className="input" {...helpForm.register('permGuide')} />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
