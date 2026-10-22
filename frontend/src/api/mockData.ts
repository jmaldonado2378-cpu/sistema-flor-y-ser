// =============================================================================
// ALMACÉN DE DATOS DE RESPALDO (SEED / MOCK DATA) - FLOR Y SER ALMACÉN NATURAL
// =============================================================================

export const MOCK_ARTICLE_FAMILIES = [
  // 1. Frutos Secos
  { id: 'fam-frutos-secos', parentId: null, code: 'FRUTOS_SECOS', name: 'Frutos Secos', articleScope: 'ALL', sortOrder: 1, isActive: true },
  { id: 'fam-mix-frutos', parentId: 'fam-frutos-secos', parentName: 'Frutos Secos', code: 'MIX_FRUTOS', name: 'Mix de frutos secos', articleScope: 'ALL', sortOrder: 1, isActive: true },

  // 2. Harinas
  { id: 'fam-harinas', parentId: null, code: 'HARINAS', name: 'Harinas', articleScope: 'ALL', sortOrder: 2, isActive: true },

  // 3. Semillas
  { id: 'fam-semillas', parentId: null, code: 'SEMILLAS', name: 'Semillas', articleScope: 'ALL', sortOrder: 3, isActive: true },

  // 4. Hierbas
  { id: 'fam-hierbas', parentId: null, code: 'HIERBAS', name: 'Hierbas', articleScope: 'ALL', sortOrder: 4, isActive: true },
  { id: 'fam-mezcla-hierbas', parentId: 'fam-hierbas', parentName: 'Hierbas', code: 'MEZCLA_HIERBAS', name: 'Mezcla de hierbas', articleScope: 'ALL', sortOrder: 1, isActive: true },

  // 5. Condimentos
  { id: 'fam-condimentos', parentId: null, code: 'CONDIMENTOS', name: 'Condimentos', articleScope: 'ALL', sortOrder: 5, isActive: true },
  { id: 'fam-especias', parentId: 'fam-condimentos', parentName: 'Condimentos', code: 'ESPECIAS', name: 'Especias', articleScope: 'ALL', sortOrder: 1, isActive: true },

  // 6. Repostería
  { id: 'fam-reposteria', parentId: null, code: 'REPOSTERIA', name: 'Repostería', articleScope: 'ALL', sortOrder: 6, isActive: true },

  // 7. Tinturas madres
  { id: 'fam-tinturas-madres', parentId: null, code: 'TINTURAS_MADRES', name: 'Tinturas madres', articleScope: 'ALL', sortOrder: 7, isActive: true },
  { id: 'fam-tinturas-simples', parentId: 'fam-tinturas-madres', parentName: 'Tinturas madres', code: 'TINTURAS_SIMPLES', name: 'Simples', articleScope: 'ALL', sortOrder: 1, isActive: true },
  { id: 'fam-tinturas-compuestas', parentId: 'fam-tinturas-madres', parentName: 'Tinturas madres', code: 'TINTURAS_COMPUESTAS', name: 'Compuestas', articleScope: 'ALL', sortOrder: 2, isActive: true },

  // 8. Hongos adaptógenos
  { id: 'fam-hongos', parentId: null, code: 'HONGOS_ADAPTOGENOS', name: 'Hongos adaptógenos', articleScope: 'ALL', sortOrder: 8, isActive: true },
  { id: 'fam-hongos-simples', parentId: 'fam-hongos', parentName: 'Hongos adaptógenos', code: 'HONGOS_SIMPLES', name: 'Simples', articleScope: 'ALL', sortOrder: 1, isActive: true },
  { id: 'fam-hongos-compuestos', parentId: 'fam-hongos', parentName: 'Hongos adaptógenos', code: 'HONGOS_COMPUESTOS', name: 'Compuestos', articleScope: 'ALL', sortOrder: 2, isActive: true },

  // 9. Infusiones
  { id: 'fam-infusiones', parentId: null, code: 'INFUSIONES', name: 'Infusiones', articleScope: 'ALL', sortOrder: 9, isActive: true },

  // 10. Yerbas mates
  { id: 'fam-yerba-mate', parentId: null, code: 'YERBAS_MATES', name: 'Yerbas mates', articleScope: 'ALL', sortOrder: 10, isActive: true },

  // 11. Aceites
  { id: 'fam-aceites', parentId: null, code: 'ACEITES', name: 'Aceites', articleScope: 'ALL', sortOrder: 11, isActive: true },
  { id: 'fam-aceites-esenciales', parentId: 'fam-aceites', parentName: 'Aceites', code: 'ACEITES_ESENCIALES', name: 'Esenciales', articleScope: 'ALL', sortOrder: 1, isActive: true },
  { id: 'fam-aceites-cosmetica', parentId: 'fam-aceites', parentName: 'Aceites', code: 'ACEITES_COSMETICA', name: 'Cosmética', articleScope: 'ALL', sortOrder: 2, isActive: true },
  { id: 'fam-aceites-macerados', parentId: 'fam-aceites', parentName: 'Aceites', code: 'ACEITES_MACERADOS', name: 'Macerados/cosmética', articleScope: 'ALL', sortOrder: 3, isActive: true },
  { id: 'fam-aceites-coco', parentId: 'fam-aceites', parentName: 'Aceites', code: 'ACEITES_COCO', name: 'Coco', articleScope: 'ALL', sortOrder: 4, isActive: true },
  { id: 'fam-aceites-comestibles', parentId: 'fam-aceites', parentName: 'Aceites', code: 'ACEITES_COMESTIBLES', name: 'Comestibles', articleScope: 'ALL', sortOrder: 5, isActive: true },

  // 12. Materiales de Empaque
  { id: 'fam-empaques', parentId: null, code: 'EMPAQUES', name: 'Materiales de Empaque', articleScope: 'PACKAGING', sortOrder: 12, isActive: true }
];

export const MOCK_RAW_MATERIALS = [
  { id: 'raw-1', code: 'MP-001', name: 'Nuez Mariposa Extra White', category: 'Frutos Secos', familyId: 'fam-frutos-secos', familyName: 'Frutos Secos', currentStock: 45.5, unit: 'KG', minStock: 10.0, costPerUnit: 8500, storageLocation: 'Depósito A', supplierName: 'Frutos del Sol SRL', isActive: true },
  { id: 'raw-2', code: 'MP-002', name: 'Mix de Frutos Secos Especial', category: 'Mix de frutos secos', familyId: 'fam-mix-frutos', familyName: 'Mix de frutos secos', currentStock: 120.0, unit: 'KG', minStock: 25.0, costPerUnit: 7200, storageLocation: 'Depósito A', supplierName: 'Granos del Sur S.A.', isActive: true },
  { id: 'raw-3', code: 'MP-003', name: 'Harina de Almendras Peladas', category: 'Harinas', familyId: 'fam-harinas', familyName: 'Harinas', currentStock: 18.0, unit: 'KG', minStock: 5.0, costPerUnit: 9200, storageLocation: 'Depósito B', supplierName: 'Frutos del Sol SRL', isActive: true },
  { id: 'raw-4', code: 'MP-004', name: 'Cúrcuma en Polvo Orgánica', category: 'Especias', familyId: 'fam-especias', familyName: 'Especias', currentStock: 14.2, unit: 'KG', minStock: 3.0, costPerUnit: 6400, storageLocation: 'Depósito B', supplierName: 'Granos del Sur S.A.', isActive: true }
];

export const MOCK_PACKAGING_MATERIALS = [
  { id: 'pack-1', code: 'EMP-001', name: 'Bolsa Doypack Kraft 250g c/Cierre', category: 'DOYPACK', familyId: 'fam-empaques', familyName: 'Materiales de Empaque', type: 'BAG', currentStock: 350, unit: 'UN', minStock: 100, costPerUnit: 120, storageLocation: 'Depósito C', supplierName: 'Empaques del Plata', isActive: true },
  { id: 'pack-2', code: 'EMP-002', name: 'Frasco Ambar Vidrio 500ml', category: 'JAR', familyId: 'fam-empaques', familyName: 'Materiales de Empaque', type: 'BOTTLE', currentStock: 85, unit: 'UN', minStock: 30, costPerUnit: 480, storageLocation: 'Depósito C', supplierName: 'Vidrios San José', isActive: true },
  { id: 'pack-3', code: 'EMP-003', name: 'Etiqueta Térmica NIIMBOT B1 Pro 50x30mm', category: 'LABEL', familyId: 'fam-empaques', familyName: 'Materiales de Empaque', type: 'LABEL', currentStock: 1200, unit: 'UN', minStock: 300, costPerUnit: 15, storageLocation: 'Mostrador', supplierName: 'NIIMBOT Argentina', isActive: true }
];

export const MOCK_FINAL_PRODUCTS = [
  { id: 'prod-1', code: 'PF-001', sku: 'PF-001', barcode: 'PF-001', name: 'Nuez Mariposa Doypack 250g', category: 'Frutos Secos', familyId: 'fam-frutos-secos', familyName: 'Frutos Secos', currentStock: 32, unit: 'paquetes', unitWeightGrams: 250, minStock: 10, price: 3100, salePrice: 3100, costPrice: 2245, ingredients: '100% Nuez Mariposa', isActive: true },
  { id: 'prod-2', code: 'PF-002', sku: 'PF-002', barcode: 'PF-002', name: 'Mix Frutos Secos Doypack 500g', category: 'Mix de frutos secos', familyId: 'fam-mix-frutos', familyName: 'Mix de frutos secos', currentStock: 48, unit: 'paquetes', unitWeightGrams: 500, minStock: 15, price: 4650, salePrice: 4650, costPrice: 3220, ingredients: 'Nuez, Almendra, Castaña, Pasas', isActive: true },
  { id: 'prod-3', code: 'PF-003', sku: 'PF-003', barcode: 'PF-003', name: 'Harina de Almendras 500g Apto Celiacos', category: 'Harinas', familyId: 'fam-harinas', familyName: 'Harinas', currentStock: 14, unit: 'paquetes', unitWeightGrams: 500, minStock: 5, price: 5900, salePrice: 5900, costPrice: 4720, ingredients: '100% Harina de Almendras Peladas', isActive: true }
];

export const MOCK_CUSTOMERS = [
  { id: 'cust-1', firstName: 'María Clara', lastName: 'Fernández', fullName: 'María Clara Fernández', whatsapp: '+5491155443322', phoneWhatsapp: '+5491155443322', email: 'maria.clara@email.com', address: 'Av. Corrientes 1234, CABA', dietaryProfiles: ['Sin TACC / Celíaco', 'Orgánico'], channelPreference: 'WhatsApp', preferredChannel: 'WHATSAPP', currentBalance: -1500, creditLimit: 20000, totalPoints: 340, segment: 'FRECUENTE' },
  { id: 'cust-2', firstName: 'Gonzalo', lastName: 'Benítez', fullName: 'Gonzalo Benítez', whatsapp: '+5491144332211', phoneWhatsapp: '+5491144332211', email: 'g.benitez@email.com', address: 'Calle Belgrano 456, Córdoba', dietaryProfiles: ['Vegano', 'Keto'], channelPreference: 'Local', preferredChannel: 'LOCAL', currentBalance: 0, creditLimit: 15000, totalPoints: 120, segment: 'FRECUENTE' },
  { id: 'cust-3', firstName: 'Lucía', lastName: 'Albarracín', fullName: 'Lucía Albarracín', whatsapp: '+5491166778899', phoneWhatsapp: '+5491166778899', email: 'lucia.a@email.com', address: 'San Martín 789, Mendoza', dietaryProfiles: ['Apto Diabéticos'], channelPreference: 'Web', preferredChannel: 'ONLINE_STORE', currentBalance: 3200, creditLimit: 10000, totalPoints: 510, segment: 'FRECUENTE' }
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

export const MOCK_RECEIPTS = [
  {
    id: 'rec-1',
    receiptNumber: 'FC-A001-00084920',
    supplierId: 'supp-1',
    supplierName: 'Granos del Sur S.A.',
    receiptType: 'FACTURA A',
    issueDate: '2026-08-08',
    receptionDate: '2026-08-08',
    totalAmount: 185000,
    totalCost: 185000,
    paidAmount: 185000,
    pendingBalance: 0,
    paymentStatus: 'PAID',
    items: [
      { id: 'item-1', itemName: 'Lenteja Turca Calibre Grande', quantity: 50, unitOfMeasure: 'KG', unitCost: 2200, subtotal: 110000 },
      { id: 'item-2', itemName: 'Nuez Mariposa Extra White', quantity: 10, unitOfMeasure: 'KG', unitCost: 7500, subtotal: 75000 }
    ],
    notes: 'Ingreso comprobante lote #402',
    createdAt: '2026-08-08T14:30:00.000Z'
  }
];
