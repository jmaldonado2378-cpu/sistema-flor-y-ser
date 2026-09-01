import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'raw_materials' | 'final_products';
  onSuccess: () => void;
}

interface ParsedRow {
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  data: any;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'gsheets'>('file');
  const [gsheetsUrl, setGsheetsUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const title = type === 'raw_materials' 
    ? '📊 Carga Masiva de Materias Primas' 
    : '📊 Carga Masiva de Productos Finales';

  // Descarga de Plantilla CSV
  const handleDownloadTemplate = () => {
    let headers = '';
    let sample = '';
    let filename = '';

    if (type === 'raw_materials') {
      headers = 'code,name,unit,currentStock,minStock,costPerUnit,supplierName,storageLocation';
      sample = 'MP-ALM-01,Almendras Peladas Granel,KG,45.5,10.0,8500.00,Frutos del Valle S.A.,Depósito A\nMP-GRA-01,Granola Miel & Coco,KG,80.0,15.0,3200.00,El Molino Natural,Depósito A';
      filename = 'plantilla_materias_primas_floryser.csv';
    } else {
      headers = 'code,name,unitWeightGrams,currentStock,minStock,price,ingredients';
      sample = 'PF-ALM-500,Almendras Peladas 500g,500,30,10,4800.00,100% Almendras Peladas\nPF-GRA-1000,Granola Miel & Coco 1kg,1000,50,15,3800.00,Avena, miel, coco, frutos secos';
      filename = 'plantilla_productos_finales_floryser.csv';
    }

    const blob = new Blob([`${headers}\n${sample}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parser de CSV simple
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setErrorMessage('El archivo no contiene suficientes filas de datos.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex simple para manejar comas dentro de comillas
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanValues = values.map(v => v.trim().replace(/^["']|["']$/g, ''));

      const raw: Record<string, string> = {};
      headers.forEach((h, index) => {
        raw[h] = cleanValues[index] || '';
      });

      const errors: string[] = [];
      let itemData: any = {};

      if (type === 'raw_materials') {
        const code = raw.code || raw.codigo || raw.Código || `MP-${Date.now().toString().slice(-4)}-${i}`;
        const name = raw.name || raw.nombre || raw.Nombre || '';
        const unit = raw.unit || raw.unidad || raw.Unidad || 'KG';
        const currentStock = parseFloat(raw.currentStock || raw.stock || raw.Stock || '0');
        const minStock = parseFloat(raw.minStock || raw.stockMinimo || raw.MinStock || '5');
        const costPerUnit = parseFloat(raw.costPerUnit || raw.costo || raw.Costo || '0');
        const supplierName = raw.supplierName || raw.proveedor || raw.Proveedor || '';
        const storageLocation = raw.storageLocation || raw.ubicacion || raw.Ubicacion || '';

        if (!name) errors.push('Nombre requerido');
        if (isNaN(currentStock)) errors.push('Stock inválido');

        itemData = { code, name, unit, currentStock, minStock, costPerUnit, supplierName, storageLocation };
      } else {
        const code = raw.code || raw.codigo || raw.Código || `PF-${Date.now().toString().slice(-4)}-${i}`;
        const name = raw.name || raw.nombre || raw.Nombre || '';
        const unitWeightGrams = parseFloat(raw.unitWeightGrams || raw.pesoGramo || raw.Peso || '500');
        const currentStock = parseInt(raw.currentStock || raw.stock || raw.Stock || '0', 10);
        const minStock = parseInt(raw.minStock || raw.stockMinimo || raw.MinStock || '10', 10);
        const price = parseFloat(raw.price || raw.precio || raw.Precio || '0');
        const ingredients = raw.ingredients || raw.ingredientes || raw.Ingredientes || '';

        if (!name) errors.push('Nombre requerido');
        if (isNaN(currentStock)) errors.push('Stock inválido');

        itemData = {
          code,
          name,
          unitWeightGrams: isNaN(unitWeightGrams) ? 500 : unitWeightGrams,
          netContentLabel: `${unitWeightGrams}g`,
          currentStock: isNaN(currentStock) ? 0 : currentStock,
          minStock: isNaN(minStock) ? 10 : minStock,
          price: isNaN(price) ? 0 : price,
          ingredients
        };
      }

      rows.push({
        raw,
        isValid: errors.length === 0,
        errors,
        data: itemData
      });
    }

    setParsedRows(rows);
    setErrorMessage(null);
  };

  // Procesar archivo local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) parseCSVText(content);
    };
    reader.readAsText(file);
  };

  // Procesar URL de Google Sheets
  const handleFetchGsheets = async () => {
    if (!gsheetsUrl.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      let exportUrl = gsheetsUrl.trim();
      if (exportUrl.includes('docs.google.com/spreadsheets')) {
        // Convertir URL normal de Google Sheets a export CSV
        exportUrl = exportUrl.replace(/\/edit.*$/, '/export?format=csv');
      }

      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error('No se pudo descargar la hoja. Asegúrate de que el enlace esté publicado o sea accesible.');
      
      const csvText = await res.text();
      parseCSVText(csvText);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar Importación
  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter(r => r.isValid).map(r => r.data);
    if (validItems.length === 0) {
      setErrorMessage('No hay filas válidas para importar.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('floryser_jwt_token');
      const endpoint = type === 'raw_materials' 
        ? '/api/v1/raw-materials/bulk-import' 
        : '/api/v1/final-products/bulk-import';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ items: validItems })
      });

      if (res.ok) {
        setSuccessCount(validItems.length);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Error durante la carga masiva en el servidor');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión al importar');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="820px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Banner Descarga de Plantilla */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: '#F0F7F2',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid #C2E0C9'
        }}>
          <div>
            <strong style={{ fontSize: '14px', color: '#1E3A27', display: 'block' }}>
              💡 ¿Necesitas el formato oficial de la planilla?
            </strong>
            <span style={{ fontSize: '12px', color: '#4A6B53' }}>
              Descarga la plantilla precargada con columnas listas para completar en Excel o Google Sheets.
            </span>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Download size={16} /> Descargar Plantilla .CSV
          </button>
        </div>

        {/* Pestañas Fuente de Datos */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('file')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'file' ? '#2E5339' : '#64748B',
              borderBottom: activeTab === 'file' ? '3px solid #2E5339' : 'none',
              cursor: 'pointer'
            }}
          >
            📁 Archivo Local (.CSV / .TXT)
          </button>
          <button
            onClick={() => setActiveTab('gsheets')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'gsheets' ? '#2E5339' : '#64748B',
              borderBottom: activeTab === 'gsheets' ? '3px solid #2E5339' : 'none',
              cursor: 'pointer'
            }}
          >
            🌐 Enlace de Google Sheets
          </button>
        </div>

        {/* Pestaña Archivo Local */}
        {activeTab === 'file' && (
          <div style={{
            border: '2px dashed #CBD5E1',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            background: '#F8FAFC'
          }}>
            <FileSpreadsheet size={40} style={{ color: '#64748B', marginBottom: '10px' }} />
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', fontWeight: 600 }}>
              Arrastra tu archivo CSV aquí o selecciona desde tu equipo
            </p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ fontSize: '13px' }}
            />
          </div>
        )}

        {/* Pestaña Google Sheets */}
        {activeTab === 'gsheets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
              URL de la Hoja de Google Sheets Publicada:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                value={gsheetsUrl}
                onChange={e => setGsheetsUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleFetchGsheets}
                disabled={loading}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
                Cargar Hoja
              </button>
            </div>
            <small style={{ fontSize: '11px', color: '#64748B' }}>
              Tip: En Google Sheets ve a <i>Archivo → Compartir → Publicar en la web</i> y copia el enlace.
            </small>
          </div>
        )}

        {/* Mensaje de Exito o Error */}
        {errorMessage && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {successCount !== null && (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={20} />
            ¡Éxito! Se importaron {successCount} registros correctamente en la base de datos.
          </div>
        )}

        {/* Grilla de Vista Previa */}
        {parsedRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#1E293B' }}>
                📋 Vista Previa de Filas ({parsedRows.length} detectadas)
              </h4>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: '#166534', background: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>
                  ✓ {validCount} Válidas
                </span>
                {invalidCount > 0 && (
                  <span style={{ color: '#991B1B', background: '#FEE2E2', padding: '3px 8px', borderRadius: '6px' }}>
                    ✕ {invalidCount} Con Errores
                  </span>
                )}
              </div>
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', sticky: 'top' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Estado</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Código</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Nombre</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Stock</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>
                      {type === 'raw_materials' ? 'Costo/U' : 'Precio ($)'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} style={{ background: row.isValid ? '#FFFFFF' : '#FFF5F5', borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        {row.isValid ? (
                          <span style={{ color: '#166534', fontWeight: 700 }}>🟢 Listo</span>
                        ) : (
                          <span style={{ color: '#991B1B', fontWeight: 700 }}>🔴 {row.errors.join(', ')}</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{row.data.code}</td>
                      <td style={{ padding: '8px 12px' }}>{row.data.name}</td>
                      <td style={{ padding: '8px 12px' }}>{row.data.currentStock}</td>
                      <td style={{ padding: '8px 12px' }}>
                        ${type === 'raw_materials' ? row.data.costPerUnit : row.data.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={loading || validCount === 0}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
                Confirmar Importación ({validCount} Ítems)
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
