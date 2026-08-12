// =============================================================================
// ALMACÉN DE DATOS DE RESPALDO (SEED / MOCK DATA) - FLOR Y SER ALMACÉN NATURAL
// =============================================================================

export const MOCK_ARTICLE_FAMILIES = [
  { id: 'fam-1', name: 'Almacén y Granel', code: 'ALG', scope: 'RAW_MATERIAL', subFamilies: ['Legumbres', 'Cereales', 'Frutos Secos', 'Harinas'] },
  { id: 'fam-2', name: 'Cosmética Natural', code: 'COS', scope: 'FINAL_PRODUCT', subFamilies: ['Jabones', 'Champús Sólidos', 'Aceites Esenciales'] },
  { id: 'fam-3', name: 'Hierbas y Té', code: 'TEH', scope: 'RAW_MATERIAL', subFamilies: ['Infusiones', 'Hierbas Medicinales', 'Especias'] },
  { id: 'fam-4', name: 'Suplementos y Fitoterapia', code: 'SUP', scope: 'FINAL_PRODUCT', subFamilies: ['Tinturas Madre', 'Cápsulas Naturales'] },
  { id: 'fam-5', name: 'Empaques y Envases', code: 'EMP', scope: 'PACKAGING', subFamilies: ['Bolsas Doypack', 'Frascos de Vidrio', 'Etiquetas NIIMBOT'] }
];

export const MOCK_RAW_MATERIALS = [
  { id: 'raw-1', code: 'MP-001', name: 'Nuez Mariposa Extra White', category: 'Frutos Secos', currentStock: 45.5, unit: 'kg', minStock: 10.0, costPerUnit: 8500 },
  { id: 'raw-2', code: 'MP-002', name: 'Lenteja Turca Calibre Grande', category: 'Legumbres', currentStock: 120.0, unit: 'kg', minStock: 25.0, costPerUnit: 2200 },
  { id: 'raw-3', code: 'MP-003', name: 'Harina de Almendras Peladas', category: 'Harinas', currentStock: 18.0, unit: 'kg', minStock: 5.0, costPerUnit: 9200 },
  { id: 'raw-4', code: 'MP-004', name: 'Cúrcuma en Polvo Orgánica', category: 'Especias', currentStock: 14.2, unit: 'kg', minStock: 3.0, costPerUnit: 6400 }
];

export const MOCK_PACKAGING_MATERIALS = [
  { id: 'pack-1', code: 'EMP-001', name: 'Bolsa Doypack Kraft 250g c/Cierre', type: 'BAG', currentStock: 350, unit: 'unidades', minStock: 100, costPerUnit: 120 },
  { id: 'pack-2', code: 'EMP-002', name: 'Frasco Ambar Vidrio 500ml', type: 'BOTTLE', currentStock: 85, unit: 'unidades', minStock: 30, costPerUnit: 480 },
  { id: 'pack-3', code: 'EMP-003', name: 'Etiqueta Térmica NIIMBOT B1 Pro 50x30mm', type: 'LABEL', currentStock: 1200, unit: 'unidades', minStock: 300, costPerUnit: 15 }
];

export const MOCK_FINAL_PRODUCTS = [
  { id: 'prod-1', sku: 'PF-001', name: 'Nuez Mariposa Doypack 250g', category: 'Frutos Secos', currentStock: 32, unit: 'paquetes', minStock: 10, salePrice: 3100, costPrice: 2245 },
  { id: 'prod-2', sku: 'PF-002', name: 'Lenteja Turca Fraccionada 500g', category: 'Legumbres', currentStock: 48, unit: 'paquetes', minStock: 15, salePrice: 1650, costPrice: 1220 },
  { id: 'prod-3', sku: 'PF-003', name: 'Harina de Almendras 500g Apto Celiacos', category: 'Harinas', currentStock: 14, unit: 'paquetes', minStock: 5, salePrice: 5900, costPrice: 4720 }
];

export const MOCK_CUSTOMERS = [
  { id: 'cust-1', fullName: 'María Clara Fernández', whatsapp: '+5491155443322', email: 'maria.clara@email.com', address: 'Av. Corrientes 1234, CABA', dietaryProfiles: ['Sin TACC / Celíaco', 'Orgánico'], channelPreference: 'WhatsApp', currentBalance: -1500, creditLimit: 20000, totalPoints: 340 },
  { id: 'cust-2', fullName: 'Gonzalo Benítez', whatsapp: '+5491144332211', email: 'g.benitez@email.com', address: 'Calle Belgrano 456, Córdoba', dietaryProfiles: ['Vegano', 'Keto'], channelPreference: 'Local', currentBalance: 0, creditLimit: 15000, totalPoints: 120 },
  { id: 'cust-3', fullName: 'Lucía Albarracín', whatsapp: '+5491166778899', email: 'lucia.a@email.com', address: 'San Martín 789, Mendoza', dietaryProfiles: ['Apto Diabéticos'], channelPreference: 'Web', currentBalance: 3200, creditLimit: 10000, totalPoints: 510 }
];

export const MOCK_DIETARY_PROFILES = [
  { id: '1', code: 'VEGAN', name: 'Vegano', badgeColorHex: '#5E7055', description: 'Libre de ingredientes de origen animal.' },
  { id: '2', code: 'CELIAC', name: 'Sin TACC / Celíaco', badgeColorHex: '#C87053', description: 'Sin trigo, avena, cebada ni centeno.' },
  { id: '3', code: 'ORGANIC', name: 'Orgánico', badgeColorHex: '#8B9A46', description: 'Certificación de cultivo libre de pesticidas.' },
  { id: '4', code: 'DIABETIC', name: 'Apto Diabéticos', badgeColorHex: '#6A5ACD', description: 'Sin azúcares añadidos ni alto índice glucémico.' },
  { id: '5', code: 'NUT_ALLERGY', name: 'Alergia Frutos Secos', badgeColorHex: '#D97706', description: 'Libre de trazas de frutos secos.' },
  { id: '6', code: 'KETO', name: 'Cetogénico / Keto', badgeColorHex: '#10B981', description: 'Alto en grasas saludables y muy bajo en carbohidratos.' },
  { id: '7', code: 'FODMAP', name: 'Bajo FODMAP', badgeColorHex: '#0EA5E9', description: 'Apto para síndrome de intestino irritable.' }
];

export const MOCK_TASKS = [
  { id: 'task-1', title: 'Fraccionar Lentejas Turcas 500g (Lote #402)', description: 'Fraccionar 25kg de granel en 50 doypacks', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'María Clara', dueDate: '2026-08-12' },
  { id: 'task-2', title: 'Imprimir Etiquetas NIIMBOT para Champú Sólido', description: '100 etiquetas con código de barras B1 Pro', status: 'PENDING', priority: 'MEDIUM', assignedTo: 'Juan', dueDate: '2026-08-13' },
  { id: 'task-3', title: 'Control de Stock de Frutos Secos', description: 'Verificar diferencia en Nuez Mariposa', status: 'COMPLETED', priority: 'LOW', assignedTo: 'María Clara', dueDate: '2026-08-10' }
];

export const MOCK_EXPENSES = [
  { id: 'exp-1', category: 'Alquiler', amount: 180000, date: '2026-08-01', description: 'Alquiler local comercial agosto', status: 'PAID' },
  { id: 'exp-2', category: 'Servicios', amount: 35000, date: '2026-08-05', description: 'Luz y gas almacén', status: 'PAID' },
  { id: 'exp-3', category: 'Empaques', amount: 42000, date: '2026-08-08', description: 'Compra de 500 Bolsas Doypack', status: 'PENDING' }
];

export const MOCK_SUPPLIERS = [
  { id: 'supp-1', name: 'Granos del Sur S.A.', category: 'Legumbres y Cereales', phone: '+5491133221100', email: 'ventas@granosdelsur.com', contactPerson: 'Roberto Gómez', isCertifiedOrganic: true },
  { id: 'supp-2', name: 'Frutos del Sol SRL', category: 'Frutos Secos', phone: '+5491144556677', email: 'contacto@frutosdelsol.com', contactPerson: 'Ana Rossi', isCertifiedOrganic: false }
];
