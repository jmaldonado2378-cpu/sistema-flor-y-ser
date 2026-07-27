// =============================================================================
// LÓGICA FRONTEND COMPLETA Y TOTALMENTE INTERACTIVA (V2.0) - FLOR Y SER
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const API_BASE = '/api/v1';

  // -----------------------------------------------------------------------------
  // ESTADO GLOBAL REVOLUCIONARIO DE LA APLICACIÓN
  // -----------------------------------------------------------------------------
  let activeDietaryProfiles = [
    { id: '1', code: 'VEGAN', name: 'Vegano', badgeColorHex: '#5E7055', description: 'Libre de ingredientes de origen animal.' },
    { id: '2', code: 'CELIAC', name: 'Sin TACC / Celíaco', badgeColorHex: '#C87053', description: 'Sin trigo, avena, cebada ni centeno.' },
    { id: '3', code: 'ORGANIC', name: 'Orgánico', badgeColorHex: '#8B9A46', description: 'Certificación de cultivo libre de pesticidas.' },
    { id: '4', code: 'DIABETIC', name: 'Apto Diabéticos', badgeColorHex: '#6A5ACD', description: 'Sin azúcares añadidos ni alto índice glucémico.' },
    { id: '5', code: 'NUT_ALLERGY', name: 'Alergia Frutos Secos', badgeColorHex: '#D97706', description: 'Libre de trazas de frutos secos.' },
    { id: '6', code: 'KETO', name: 'Cetogénico / Keto', badgeColorHex: '#10B981', description: 'Alto en grasas saludables y muy bajo en carbohidratos.' },
    { id: '7', code: 'FODMAP', name: 'Bajo FODMAP', badgeColorHex: '#0EA5E9', description: 'Apto para síndrome de intestino irritable.' }
  ];

  let currentCustomers = [
    {
      id: 'c-101',
      firstName: 'Martina',
      lastName: 'Gómez',
      phoneWhatsapp: '+5491133445566',
      email: 'martina.gomez@email.com',
      instagram: '@martina_floryser',
      address: 'Av. Corrientes 1420, CABA',
      birthDate: '1992-05-14',
      preferredChannel: 'WHATSAPP',
      segment: 'VIP',
      pointsBalance: 1250,
      currentAccountBalance: 8450,
      creditLimit: 50000,
      notes: 'Prefiere entregas los días martes por la tarde.',
      dietaryProfiles: [
        { id: '1', code: 'VEGAN', name: 'Vegano', badgeColorHex: '#5E7055' },
        { id: '2', code: 'CELIAC', name: 'Sin TACC', badgeColorHex: '#C87053' }
      ]
    },
    {
      id: 'c-102',
      firstName: 'Lucas',
      lastName: 'Benítez',
      phoneWhatsapp: '+5491144321199',
      email: 'lucas.benitez@email.com',
      instagram: '@lucas_keto',
      address: 'Calle Florida 890, CABA',
      birthDate: '1988-11-15',
      preferredChannel: 'LOCAL',
      segment: 'Frecuente',
      pointsBalance: 3400,
      currentAccountBalance: 0,
      creditLimit: 30000,
      notes: 'Cliente de mostrador. Compra frutos secos a granel.',
      dietaryProfiles: [
        { id: '6', code: 'KETO', name: 'Keto', badgeColorHex: '#10B981' }
      ]
    },
    {
      id: 'c-103',
      firstName: 'Sofía',
      lastName: 'Ramírez',
      phoneWhatsapp: '+5491166778899',
      email: 'sofia.ramirez@email.com',
      instagram: '@sofia_organica',
      address: 'Av. Belgrano 2300, Olivos',
      birthDate: '1995-08-22',
      preferredChannel: 'TIENDA_ONLINE',
      segment: 'Frecuente',
      pointsBalance: 890,
      currentAccountBalance: 12300,
      creditLimit: 40000,
      notes: 'Solicita siempre empaque biodegradable.',
      dietaryProfiles: [
        { id: '3', code: 'ORGANIC', name: 'Orgánico', badgeColorHex: '#8B9A46' }
      ]
    },
    {
      id: 'c-104',
      firstName: 'Carlos',
      lastName: 'Spinetta',
      phoneWhatsapp: '+5491122334455',
      email: 'carlos.spinetta@email.com',
      instagram: '@carlos_spinetta',
      address: 'Calle Santa Fe 4500, Palermo',
      birthDate: '1979-02-10',
      preferredChannel: 'WHATSAPP',
      segment: 'Mayorista',
      pointsBalance: 4200,
      currentAccountBalance: 34000,
      creditLimit: 100000,
      notes: 'Recompra mensual de harinas de almendra.',
      dietaryProfiles: [
        { id: '2', code: 'CELIAC', name: 'Sin TACC', badgeColorHex: '#C87053' }
      ]
    }
  ];

  let currentSuppliers = [
    { id: 's1', taxId: '30-70891234-9', businessName: 'Frutos del Valle S.A.', contactName: 'Roberto Gómez', phone: '+5491144332211', email: 'ventas@frutosdelvalle.com', commercialTerms: 'Cta Cte 30 días', balance: 184000 },
    { id: 's2', taxId: '30-66442211-5', businessName: 'Hierbas & Especias del Sur', contactName: 'Laura Fernández', phone: '+5491155667788', email: 'contacto@hierbassur.com', commercialTerms: 'Pago al contado (5% desc)', balance: 65000 },
    { id: 's3', taxId: '30-71122334-2', businessName: 'Molinos & Granos Orgánicos', contactName: 'Mariano Silva', phone: '+5491133445566', email: 'pedidos@molinosorganicos.com', commercialTerms: 'Cta Cte 15 días', balance: 0 },
    { id: 's4', taxId: '30-79887766-1', businessName: 'Envases & Packaging Ecológico', contactName: 'Patricia Luna', phone: '+5491188776655', email: 'patricia@envaseseco.com', commercialTerms: 'Cheque 30 días', balance: 35000 }
  ];

  let rawMaterials = [
    { id: 'rm-1', code: 'MP-NUE-01', name: 'Nueces Peladas Granel', currentStock: 25.42, minStock: 5.0, unit: 'kg', costPerUnit: 16200, supplierName: 'Frutos del Valle S.A.', storageLocation: 'Estantería 1' },
    { id: 'rm-2', code: 'MP-ALM-01', name: 'Almendras Peladas Granel', currentStock: 30.70, minStock: 5.0, unit: 'kg', costPerUnit: 19800, supplierName: 'Frutos del Valle S.A.', storageLocation: 'Estantería 1' },
    { id: 'rm-3', code: 'MP-CAS-01', name: 'Castañas de Cajú Granel', currentStock: 15.52, minStock: 5.0, unit: 'kg', costPerUnit: 16850, supplierName: 'Frutos del Valle S.A.', storageLocation: 'Estantería 1' },
    { id: 'rm-4', code: 'MP-MAN-01', name: 'Maní Tostado Granel', currentStock: 40.00, minStock: 10.0, unit: 'kg', costPerUnit: 3750, supplierName: 'Frutos del Valle S.A.', storageLocation: 'Estantería 1' },
    { id: 'rm-5', code: 'MP-BAN-01', name: 'Chips de Banana Granel', currentStock: 12.00, minStock: 5.0, unit: 'kg', costPerUnit: 12900, supplierName: 'Frutos del Valle S.A.', storageLocation: 'Estantería 1' },
    { id: 'rm-6', code: 'MP-CED-01', name: 'Cedrón Hojas Granel', currentStock: 8.20, minStock: 2.0, unit: 'kg', costPerUnit: 24750, supplierName: 'Hierbas & Especias del Sur', storageLocation: 'Estantería 2' },
    { id: 'rm-7', code: 'MP-POL-01', name: 'Poleo Hierba Granel', currentStock: 5.17, minStock: 2.0, unit: 'kg', costPerUnit: 11950, supplierName: 'Hierbas & Especias del Sur', storageLocation: 'Estantería 2' },
    { id: 'rm-8', code: 'MP-MEN-01', name: 'Menta Hojas Granel', currentStock: 6.05, minStock: 2.0, unit: 'kg', costPerUnit: 13150, supplierName: 'Hierbas & Especias del Sur', storageLocation: 'Estantería 2' }
  ];

  let finalProducts = [
    { id: 'fp-1', code: 'NUE-100', barcode: '7791112223331', name: 'Nueces x 100 gr', netWeightLabel: '100g', currentStock: 15, minStock: 3, salePrice: 1620, dietaryProfiles: ['Sin TACC', 'Vegano'] },
    { id: 'fp-2', code: 'NUE-250', barcode: '7791112223332', name: 'Nueces x 250 gr', netWeightLabel: '250g', currentStock: 8, minStock: 2, salePrice: 4050, dietaryProfiles: ['Sin TACC', 'Vegano'] },
    { id: 'fp-3', code: 'ALM-100', barcode: '7791112223333', name: 'Almendras x 100 gr', netWeightLabel: '100g', currentStock: 20, minStock: 3, salePrice: 1980, dietaryProfiles: ['Sin TACC', 'Keto'] },
    { id: 'fp-4', code: 'ALM-250', barcode: '7791112223334', name: 'Almendras x 250 gr', netWeightLabel: '250g', currentStock: 12, minStock: 2, salePrice: 4950, dietaryProfiles: ['Sin TACC', 'Keto'] },
    { id: 'fp-5', code: 'CAS-100', barcode: '7791112223335', name: 'Castañas x 100 gr', netWeightLabel: '100g', currentStock: 10, minStock: 3, salePrice: 1685, dietaryProfiles: ['Orgánico'] },
    { id: 'fp-6', code: 'CAS-250', barcode: '7791112223336', name: 'Castañas x 250 gr', netWeightLabel: '250g', currentStock: 6, minStock: 2, salePrice: 4012, dietaryProfiles: ['Orgánico'] },
    { id: 'fp-7', code: 'MANI-100', barcode: '7791112223337', name: 'Maní x 100 gr', netWeightLabel: '100g', currentStock: 25, minStock: 3, salePrice: 375, dietaryProfiles: ['Vegano'] },
    { id: 'fp-8', code: 'MANI-250', barcode: '7791112223338', name: 'Maní x 250 gr', netWeightLabel: '250g', currentStock: 14, minStock: 2, salePrice: 938, dietaryProfiles: ['Vegano'] },
    { id: 'fp-9', code: 'HAR-250', barcode: '7791112223347', name: 'Harina de Almendra x 250 gr', netWeightLabel: '250g', currentStock: 10, minStock: 2, salePrice: 1750, dietaryProfiles: ['Sin TACC', 'Keto'] }
  ];

  let operatingExpenses = [
    { id: 'exp-1', date: '2026-07-22', category: 'ALQUILER', description: 'Alquiler de Depósito & Local Mostrador', method: 'TRANSFERENCIA', amount: 180000 },
    { id: 'exp-2', date: '2026-07-20', category: 'LOGISTICA', description: 'Compra de Bolsas Kraft & Envoltorios Ecológicos', method: 'MERCADO_PAGO', amount: 35000 },
    { id: 'exp-3', date: '2026-07-18', category: 'SERVICIOS', description: 'Factura de Energía Eléctrica Depósito', method: 'TRANSFERENCIA', amount: 42500 },
    { id: 'exp-4', date: '2026-07-15', category: 'SUELDOS', description: 'Pago de Mano de Obra Fraccionado y Empaque', method: 'EFECTIVO', amount: 95000 },
    { id: 'exp-5', date: '2026-07-10', category: 'MARKETING', description: 'Campaña Anuncios Meta / WhatsApp Business', method: 'MERCADO_PAGO', amount: 28000 }
  ];

  let mockTasksBoard = {
    PENDING_FRACTIONING: [
      { id: 't1', title: 'Fraccionar saco de Almendras (10kg)', priority: 'HIGH', productName: 'Almendras Peladas', batchNumber: 'L-ALM-2026-07', operator: 'Juan Pérez', targetWeight: '10.00 kg', notes: 'Verificar humedad pre-sellado.' },
      { id: 't2', title: 'Fraccionar Avena Arrollada (25kg)', priority: 'MEDIUM', productName: 'Avena Orgánica', batchNumber: 'L-AVE-2026-06', operator: 'María Luz', targetWeight: '25.00 kg', notes: 'Empaque kraft de 500g.' }
    ],
    PACKAGING_IN_PROGRESS: [
      { id: 't4', title: 'Empaque de Granola Artesanal 500g', priority: 'HIGH', productName: 'Granola Coco & Almendras', batchNumber: 'L-GRA-2026-07', operator: 'Lucas G.', targetWeight: '500g x 30 un', notes: 'Sellado al vacío.' }
    ],
    QUALITY_CONTROL: [
      { id: 't5', title: 'Control de Calidad en Lote L-ALM-2026-07', priority: 'HIGH', productName: 'Almendras Peladas Selección', batchNumber: 'L-ALM-2026-07', operator: 'Control Calidad', targetWeight: '25.00 kg', notes: 'Etiquetado NIIMBOT verificado.' }
    ],
    COMPLETED: [
      { id: 't6', title: 'Limpieza y Sanitización de Contenedores de Harina', priority: 'MEDIUM', productName: 'General', batchNumber: 'N/A', operator: 'Equipo Planta', targetWeight: 'N/A', notes: 'Puntaje 100% aprobado.' }
    ]
  };

  let mockSalesBoard = {
    RECEIVED: [
      { id: 'ord-001', orderNumber: 'PED-8821', customerName: 'Martina Gómez', phone: '+5491133445566', address: 'Av. Corrientes 1420', payment: 'Mercado Pago', items: [{ name: 'Nueces x 250 gr', qty: 2, price: 4050, subtotal: 8100 }, { name: 'Almendras x 250 gr', qty: 1, price: 4950, subtotal: 4950 }], totalAmount: 13050, date: '2026-07-25 14:30' }
    ],
    IN_PREPARATION: [
      { id: 'ord-002', orderNumber: 'PED-8822', customerName: 'Lucas Benítez', phone: '+5491144321199', address: 'Calle Florida 890', payment: 'Efectivo Mostrador', items: [{ name: 'Almendras x 100 gr', qty: 5, price: 1980, subtotal: 9900 }], totalAmount: 9900, date: '2026-07-25 12:15' }
    ],
    READY_FOR_DELIVERY: [
      { id: 'ord-003', orderNumber: 'PED-8820', customerName: 'Sofía Ramírez', phone: '+5491166778899', address: 'Av. Belgrano 2300', payment: 'Transferencia', items: [{ name: 'Castañas x 250 gr', qty: 3, price: 4012, subtotal: 12036 }], totalAmount: 12036, date: '2026-07-24 18:00' }
    ],
    IN_DELIVERY: [
      { id: 'ord-004', orderNumber: 'PED-8819', customerName: 'Carlos Spinetta', phone: '+5491122334455', address: 'Calle Santa Fe 4500', payment: 'Cta Cte', items: [{ name: 'Harina de Almendra x 250 gr', qty: 10, price: 1750, subtotal: 17500 }], totalAmount: 17500, date: '2026-07-24 10:20' }
    ],
    DELIVERED: [
      { id: 'ord-005', orderNumber: 'PED-8815', customerName: 'Martina Gómez', phone: '+5491133445566', address: 'Av. Corrientes 1420', payment: 'Mercado Pago', items: [{ name: 'Mix Frutos Secos x 250 gr', qty: 4, price: 4800, subtotal: 19200 }], totalAmount: 19200, date: '2026-07-23 15:45' }
    ]
  };

  let activeTaskForModal = null;
  let activeOrderForModal = null;
  let activeSupplierForModal = null;
  let activeCustPaymentModal = null;
  let activeSuppPaymentModal = null;

  // -----------------------------------------------------------------------------
  // COLAPSO / EXPANSION DE SIDEBAR EN NAVEGADOR Y TABLETS
  // -----------------------------------------------------------------------------
  const mainSidebar = document.getElementById('main-sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

  if (btnToggleSidebar && mainSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      mainSidebar.classList.toggle('collapsed');
      const isCollapsed = mainSidebar.classList.contains('collapsed');
      btnToggleSidebar.innerHTML = isCollapsed
        ? `<i data-lucide="panel-left-open"></i>`
        : `<i data-lucide="panel-left-close"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // -----------------------------------------------------------------------------
  // GESTIÓN DE USUARIOS Y AUTENTICACIÓN POR PIN (RBAC + NUMPAD POS + MATRIZ DE PERMISOS)
  // -----------------------------------------------------------------------------
  let systemUsers = [
    {
      id: 'u1', name: 'María Clara', role: 'ADMIN', pin: '1234', avatar: 'MC', title: 'Dueño / Admin',
      customAllowedTabs: [
        'tab-dashboard', 'tab-crm', 'tab-automations', 'tab-inventory',
        'tab-goods-receipt', 'tab-fractioning', 'tab-suppliers', 'tab-kanban-tasks',
        'tab-sales', 'tab-kanban-orders', 'tab-printer', 'tab-finance-customers',
        'tab-finance-suppliers', 'tab-finance-expenses', 'tab-finance-pricing', 'tab-settings'
      ]
    },
    {
      id: 'u2', name: 'Juan Pérez', role: 'CASHIER', pin: '4321', avatar: 'JP', title: 'Cajero / Ventas',
      customAllowedTabs: [
        'tab-dashboard', 'tab-sales', 'tab-kanban-orders', 'tab-crm',
        'tab-finance-customers', 'tab-printer'
      ]
    },
    {
      id: 'u3', name: 'Carlos Ruiz', role: 'OPERATOR', pin: '9999', avatar: 'CR', title: 'Operario Depósito',
      customAllowedTabs: [
        'tab-dashboard', 'tab-inventory', 'tab-goods-receipt', 'tab-fractioning',
        'tab-kanban-tasks', 'tab-printer', 'tab-suppliers'
      ]
    }
  ];
  let activeUserSession = systemUsers[0];

  const rolePermissions = {
    ADMIN: {
      name: 'María Clara (Dueño / Admin)',
      allowedTabs: [
        'tab-dashboard', 'tab-crm', 'tab-automations', 'tab-inventory',
        'tab-goods-receipt', 'tab-fractioning', 'tab-suppliers', 'tab-kanban-tasks',
        'tab-sales', 'tab-kanban-orders', 'tab-printer', 'tab-finance-customers',
        'tab-finance-suppliers', 'tab-finance-expenses', 'tab-finance-pricing', 'tab-settings'
      ]
    },
    CASHIER: {
      name: 'Juan Pérez (Cajero / Ventas)',
      allowedTabs: [
        'tab-dashboard', 'tab-sales', 'tab-kanban-orders', 'tab-crm',
        'tab-finance-customers', 'tab-printer'
      ]
    },
    OPERATOR: {
      name: 'Carlos Ruiz (Operario Depósito)',
      allowedTabs: [
        'tab-dashboard', 'tab-inventory', 'tab-goods-receipt', 'tab-fractioning',
        'tab-kanban-tasks', 'tab-printer', 'tab-suppliers'
      ]
    }
  };

  const userRoleSelect = document.getElementById('user-role-select');

  function applyRolePermissions(roleKey) {
    const allowed = activeUserSession.customAllowedTabs || (rolePermissions[roleKey] || rolePermissions.ADMIN).allowedTabs;

    document.querySelectorAll('.nav-item').forEach(item => {
      const tabId = item.getAttribute('data-tab');
      if (allowed.includes(tabId)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    document.querySelectorAll('.nav-group-title').forEach(titleElem => {
      let nextElem = titleElem.nextElementSibling;
      let hasVisibleChild = false;

      while (nextElem && !nextElem.classList.contains('nav-group-title')) {
        if (nextElem.classList.contains('nav-item') && nextElem.style.display !== 'none') {
          hasVisibleChild = true;
          break;
        }
        nextElem = nextElem.nextElementSibling;
      }

      titleElem.style.display = hasVisibleChild ? 'block' : 'none';
    });

    const activeNavBtn = document.querySelector('.nav-item.active');
    const activeTabId = activeNavBtn?.getAttribute('data-tab');

    if (!allowed.includes(activeTabId)) {
      const firstAllowedBtn = document.querySelector(`.nav-item[data-tab="${allowed[0]}"]`);
      if (firstAllowedBtn) firstAllowedBtn.click();
    }
  }

  // Interceptar selector de usuario con Autenticación por PIN Numérico
  if (userRoleSelect) {
    userRoleSelect.addEventListener('change', (e) => {
      const selectedUserId = e.target.value;
      const targetUser = systemUsers.find(u => u.id === selectedUserId) || systemUsers[0];

      // Revertir selector temporalmente hasta que se ingrese el PIN correcto
      userRoleSelect.value = activeUserSession.id;

      openPinAuthModal(targetUser, () => {
        activeUserSession = targetUser;
        userRoleSelect.value = targetUser.id;
        applyRolePermissions(targetUser.role);

        // Actualizar Badge en Top Header
        const avatarCircle = document.querySelector('.user-avatar-circle');
        const profileBadgeSpan = document.querySelector('.user-profile-badge span');
        if (avatarCircle) avatarCircle.innerText = targetUser.avatar;
        if (profileBadgeSpan) profileBadgeSpan.innerText = targetUser.name;

        alert(`✅ Sesión iniciada con éxito como ${targetUser.name} (${targetUser.title}).`);
      });
    });
  }

  // Hacer el Badge de Usuario en la barra superior interactivo para cambio rápido
  const userProfileBadge = document.querySelector('.user-profile-badge');
  if (userProfileBadge && userRoleSelect) {
    userProfileBadge.style.cursor = 'pointer';
    userProfileBadge.title = 'Hacé clic para cambiar de usuario activo';
    userProfileBadge.addEventListener('click', () => {
      userRoleSelect.focus();
      try { userRoleSelect.showPicker(); } catch (err) {}
    });
  }

  // -----------------------------------------------------------------------------
  // CONTROLES DE MODAL AUTENTICACIÓN POR PIN NUMÉRICO (NUMPAD POS)
  // -----------------------------------------------------------------------------
  const modalPinAuth = document.getElementById('modal-pin-auth');
  const btnClosePinAuth = document.getElementById('btn-close-pin-auth-modal');
  let currentTypedPin = '';
  let pendingPinCallback = null;
  let targetUserForPin = null;

  if (btnClosePinAuth && modalPinAuth) {
    btnClosePinAuth.addEventListener('click', () => {
      modalPinAuth.classList.remove('active');
      if (userRoleSelect) userRoleSelect.value = activeUserSession.id;
    });
  }

  function openPinAuthModal(userObj, onSuccessCallback) {
    targetUserForPin = userObj;
    pendingPinCallback = onSuccessCallback;
    currentTypedPin = '';
    updatePinDisplayDots();

    const nameElem = document.getElementById('pin-modal-username');
    const roleElem = document.getElementById('pin-modal-role');
    const avatarElem = document.getElementById('pin-modal-avatar');

    if (nameElem) nameElem.innerText = userObj.name;
    if (roleElem) roleElem.innerText = `Ingresa tu PIN de 4 dígitos (${userObj.title})`;
    if (avatarElem) avatarElem.innerText = userObj.avatar;

    if (modalPinAuth) modalPinAuth.classList.add('active');
  }
    updatePinDisplayDots();

    const nameElem = document.getElementById('pin-modal-username');
    const roleElem = document.getElementById('pin-modal-role');
    const avatarElem = document.getElementById('pin-modal-avatar');

    if (nameElem) nameElem.innerText = userObj.name;
    if (roleElem) roleElem.innerText = `Ingresa tu PIN de 4 dígitos (${userObj.title})`;
    if (avatarElem) avatarElem.innerText = userObj.avatar;

    if (modalPinAuth) modalPinAuth.classList.add('active');
  }

  function updatePinDisplayDots() {
    const dotsContainer = document.getElementById('pin-display-dots');
    if (!dotsContainer) return;

    const len = currentTypedPin.length;
    let dotsHtml = '';
    for (let i = 0; i < 4; i++) {
      dotsHtml += i < len ? `<span class="pin-dot" style="color: var(--primary-sage);">●</span>` : `<span class="pin-dot" style="color: #CBD5E1;">○</span>`;
    }
    dotsContainer.innerHTML = dotsHtml;
  }

  document.querySelectorAll('.numpad-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.target.getAttribute('data-val');
      if (currentTypedPin.length < 6) {
        currentTypedPin += val;
        updatePinDisplayDots();
        if (currentTypedPin.length === 4 && targetUserForPin) {
          verifyEnteredPin();
        }
      }
    });
  });

  const btnNumpadClear = document.getElementById('btn-numpad-clear');
  if (btnNumpadClear) {
    btnNumpadClear.addEventListener('click', () => {
      currentTypedPin = currentTypedPin.slice(0, -1);
      updatePinDisplayDots();
    });
  }

  const btnNumpadOk = document.getElementById('btn-numpad-ok');
  if (btnNumpadOk) {
    btnNumpadOk.addEventListener('click', () => {
      verifyEnteredPin();
    });
  }

  function verifyEnteredPin() {
    if (!targetUserForPin) return;

    if (currentTypedPin === targetUserForPin.pin) {
      if (modalPinAuth) modalPinAuth.classList.remove('active');
      const cb = pendingPinCallback;
      pendingPinCallback = null;
      if (cb) cb();
    } else {
      alert(`❌ PIN de seguridad incorrecto. Intenta nuevamente.`);
      currentTypedPin = '';
      updatePinDisplayDots();
    }
  }

  // -----------------------------------------------------------------------------
  // ESCÁNER DE CÓDIGOS QR INTELIGENTES (CÁMARA / LÁSER)
  // -----------------------------------------------------------------------------
  const modalQrScanner = document.getElementById('modal-qr-scanner');
  const btnOpenSalesQrScanner = document.getElementById('btn-open-sales-qr-scanner');
  const btnCloseQrScanner = document.getElementById('btn-close-qr-scanner-modal');
  const qrManualInput = document.getElementById('qr-manual-input');
  const btnSubmitManualQr = document.getElementById('btn-submit-manual-qr');

  if (btnOpenSalesQrScanner && modalQrScanner) {
    btnOpenSalesQrScanner.addEventListener('click', () => {
      modalQrScanner.classList.add('active');
      if (qrManualInput) {
        qrManualInput.value = '';
        setTimeout(() => qrManualInput.focus(), 200);
      }
    });
  }

  if (btnCloseQrScanner && modalQrScanner) {
    btnCloseQrScanner.addEventListener('click', () => modalQrScanner.classList.remove('active'));
  }

  function processScannedQRPayload(rawText) {
    if (!rawText || rawText.trim().length === 0) return;
    const cleanQuery = rawText.trim().toLowerCase();

    // Buscar en Productos Empaquetados por SKU, código o nombre
    const foundProd = finalProducts.find(p =>
      p.code.toLowerCase() === cleanQuery ||
      p.name.toLowerCase().includes(cleanQuery) ||
      (p.barcode && p.barcode.toLowerCase() === cleanQuery)
    );

    if (foundProd) {
      addSelectedItemToSale(foundProd);
      if (modalQrScanner) modalQrScanner.classList.remove('active');
      alert(`✅ ¡Código QR Escaneado con Éxito!\nProducto: "${foundProd.name}" ($${foundProd.salePrice.toLocaleString()}) añadido al carrito.`);
      return;
    }

    // Buscar en Materias Primas / Granel
    const foundRaw = rawMaterials.find(m =>
      m.code.toLowerCase() === cleanQuery ||
      m.name.toLowerCase().includes(cleanQuery)
    );

    if (foundRaw) {
      if (modalQrScanner) modalQrScanner.classList.remove('active');
      alert(`✅ Código QR de Insumo Granel detectado: "${foundRaw.name}" (${foundRaw.code}) - Stock Actual: ${foundRaw.currentStock} ${foundRaw.unit}.`);
      return;
    }

    alert(`⚠️ No se encontró ningún producto o insumo activo con el código QR escaneado: "${rawText}".`);
  }

  if (btnSubmitManualQr && qrManualInput) {
    btnSubmitManualQr.addEventListener('click', () => {
      processScannedQRPayload(qrManualInput.value);
    });

    qrManualInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        processScannedQRPayload(qrManualInput.value);
      }
    });
  }

  // -----------------------------------------------------------------------------
  // NAVEGACIÓN Y CAMBIO DE PESTAÑAS (TABS)
  // -----------------------------------------------------------------------------
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      const targetEl = document.getElementById(targetTab);
      if (targetEl) targetEl.classList.add('active');

      refreshViewData(targetTab);
      if (window.lucide) lucide.createIcons();
    });
  });

  function refreshViewData(targetTab) {
    if (targetTab === 'tab-crm') renderMasterCustomersTable(currentCustomers);
    if (targetTab === 'tab-automations') loadMarketingData();
    if (targetTab === 'tab-inventory') loadInventoryData();
    if (targetTab === 'tab-goods-receipt') loadGoodsReceiptData();
    if (targetTab === 'tab-fractioning') loadFractioningData();
    if (targetTab === 'tab-suppliers') loadSuppliersData();
    if (targetTab === 'tab-kanban-tasks') renderTaskKanbanBoard(mockTasksBoard);
    if (targetTab === 'tab-sales') loadSalesFormData();
    if (targetTab === 'tab-kanban-orders') renderSalesKanbanBoard(mockSalesBoard);
    if (targetTab === 'tab-finance-customers') loadFinanceCustomers();
    if (targetTab === 'tab-finance-suppliers') loadFinanceSuppliers();
    if (targetTab === 'tab-finance-expenses') loadExpensesData();
    if (targetTab === 'tab-finance-pricing') loadPricingMatrix();
  }

  // -----------------------------------------------------------------------------
  // CLIENTES & DRAWER EDICIÓN EN TIEMPO REAL
  // -----------------------------------------------------------------------------
  function populateCustomerSelects() {
    const saleSelect = document.getElementById('sale-customer-select');
    if (saleSelect) {
      saleSelect.innerHTML = `<option value="">-- Seleccionar Cliente --</option>` + currentCustomers.map(c => `
        <option value="${c.id}">${c.firstName} ${c.lastName} (${c.phoneWhatsapp})</option>
      `).join('');
    }
  }

  function renderMasterCustomersTable(list) {
    const tbody = document.getElementById('table-master-customers');
    if (!tbody) return;

    tbody.innerHTML = list.map(c => {
      const initials = `${c.firstName ? c.firstName[0] : 'C'}${c.lastName ? c.lastName[0] : ''}`.toUpperCase();
      const debtColor = c.currentAccountBalance > 0 ? '#EF4444' : '#10B981';
      const debtText = c.currentAccountBalance > 0 ? `$${c.currentAccountBalance.toLocaleString()}` : '$0 (Al día)';

      const tagsHtml = (c.dietaryProfiles || []).map(dp => `
        <span class="diet-tag" style="background-color: ${dp.badgeColorHex || '#5E7055'}; font-size: 10px;">${dp.name}</span>
      `).join(' ');

      return `
        <tr class="customer-row" data-id="${c.id}" style="cursor: pointer;">
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="customer-avatar" style="width: 34px; height: 34px; font-size: 13px;">${initials}</div>
              <div>
                <strong>${c.firstName} ${c.lastName}</strong><br>
                <small style="color: var(--text-muted);">${c.email || 'Sin correo'} ${c.instagram ? `<span style="color: #E1306C; font-weight: 600; margin-left: 4px;">(${c.instagram})</span>` : ''}</small>
              </div>
            </div>
          </td>
          <td><strong>${c.phoneWhatsapp}</strong></td>
          <td><span class="badge" style="background: var(--craft-light); color: var(--text-dark); font-size: 11px;">${c.preferredChannel}</span></td>
          <td><span class="badge-segment ${c.segment}">${c.segment || 'Frecuente'}</span></td>
          <td>${tagsHtml || '<small style="color: var(--text-muted);">Sin dietas</small>'}</td>
          <td style="font-weight: 700; color: ${debtColor};">${debtText}</td>
          <td style="font-weight: 700;">${c.pointsBalance || 0} pts</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-open-drawer" data-id="${c.id}">
              <i data-lucide="edit"></i> Ver / Editar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-open-drawer, .customer-row').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        const customer = currentCustomers.find(c => c.id === id);
        if (customer) openCustomerDrawer(customer);
      });
    });

    populateCustomerSelects();
    if (window.lucide) lucide.createIcons();
  }

  const globalCustSearch = document.getElementById('global-customer-search');
  const filterCustSearch = document.getElementById('filter-customer-search');
  const filterCustDiet = document.getElementById('filter-customer-diet');
  const filterCustSegment = document.getElementById('filter-customer-segment');
  const filterCustBalance = document.getElementById('filter-customer-balance');

  function applyCustomerFilters() {
    const q1 = (globalCustSearch?.value || '').toLowerCase().trim();
    const q2 = (filterCustSearch?.value || '').toLowerCase().trim();
    const diet = (filterCustDiet?.value || '');
    const segment = (filterCustSegment?.value || '');
    const balance = (filterCustBalance?.value || '');

    const filtered = currentCustomers.filter(c => {
      const textMatch1 = !q1 || `${c.firstName} ${c.lastName} ${c.phoneWhatsapp} ${c.email} ${c.instagram || ''}`.toLowerCase().includes(q1);
      const textMatch2 = !q2 || `${c.firstName} ${c.lastName} ${c.phoneWhatsapp} ${c.email} ${c.instagram || ''}`.toLowerCase().includes(q2);
      const dietMatch = !diet || (c.dietaryProfiles || []).some(dp => dp.code === diet);
      const segmentMatch = !segment || (c.segment || '') === segment;
      const balanceMatch = !balance || (balance === 'DEBT' ? c.currentAccountBalance > 0 : c.currentAccountBalance === 0);

      return textMatch1 && textMatch2 && dietMatch && segmentMatch && balanceMatch;
    });

    renderMasterCustomersTable(filtered);
  }

  [globalCustSearch, filterCustSearch, filterCustDiet, filterCustSegment, filterCustBalance].forEach(el => {
    if (el) el.addEventListener('input', applyCustomerFilters);
    if (el) el.addEventListener('change', applyCustomerFilters);
  });

  // Slide-Over Drawer Cliente
  const drawerBackdrop = document.getElementById('customer-drawer-backdrop');
  const drawerClose = document.getElementById('drawer-close');
  const btnCancelDrawer = document.getElementById('btn-cancel-drawer');
  const btnSaveDrawer = document.getElementById('btn-save-drawer-customer');

  function openCustomerDrawer(customer) {
    activeCustomer = customer;
    if (!drawerBackdrop) return;

    const nameEl = document.getElementById('drawer-name');
    const avatarEl = document.getElementById('drawer-avatar');
    const segmentEl = document.getElementById('drawer-segment');
    const fnEl = document.getElementById('drawer-firstname');
    const lnEl = document.getElementById('drawer-lastname');
    const phEl = document.getElementById('drawer-phone');
    const emEl = document.getElementById('drawer-email');
    const igEl = document.getElementById('drawer-instagram');
    const adEl = document.getElementById('drawer-address');
    const bdEl = document.getElementById('drawer-birthdate');
    const chEl = document.getElementById('drawer-channel');
    const ptsEl = document.getElementById('drawer-points');
    const balEl = document.getElementById('drawer-current-balance');
    const limEl = document.getElementById('drawer-credit-limit');
    const noteEl = document.getElementById('drawer-notes');

    if (nameEl) nameEl.innerText = `${customer.firstName} ${customer.lastName}`;
    if (avatarEl) avatarEl.innerText = `${customer.firstName[0] || 'C'}${customer.lastName[0] || ''}`.toUpperCase();
    if (segmentEl) segmentEl.innerText = customer.segment || 'Frecuente';

    if (fnEl) fnEl.value = customer.firstName || '';
    if (lnEl) lnEl.value = customer.lastName || '';
    if (phEl) phEl.value = customer.phoneWhatsapp || '';
    if (emEl) emEl.value = customer.email || '';
    if (igEl) igEl.value = customer.instagram || '';
    if (adEl) adEl.value = customer.address || '';
    if (bdEl) bdEl.value = customer.birthDate || '';
    if (chEl) chEl.value = customer.preferredChannel || 'WHATSAPP';
    if (ptsEl) ptsEl.value = customer.pointsBalance || 0;
    if (balEl) balEl.value = customer.currentAccountBalance || 0;
    if (limEl) limEl.value = customer.creditLimit || 30000;
    if (noteEl) noteEl.value = customer.notes || '';

    // Cargar checkboxes de dietas en la ficha
    const dietContainer = document.getElementById('drawer-diet-checkboxes');
    if (dietContainer) {
      const activeIds = (customer.dietaryProfiles || []).map(dp => dp.id || dp.code);
      dietContainer.innerHTML = activeDietaryProfiles.map(d => {
        const isChecked = activeIds.includes(d.id) || activeIds.includes(d.code);
        return `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" value="${d.id}" class="drawer-diet-cb" ${isChecked ? 'checked' : ''}>
            <span class="diet-tag" style="background-color: ${d.badgeColorHex}; font-size: 10px;">${d.name}</span>
          </label>
        `;
      }).join('');
    }

    drawerBackdrop.classList.add('active');
  }

  if (drawerClose) drawerClose.addEventListener('click', () => drawerBackdrop.classList.remove('active'));
  if (btnCancelDrawer) btnCancelDrawer.addEventListener('click', () => drawerBackdrop.classList.remove('active'));

  const formEditDrawer = document.getElementById('form-edit-drawer-customer');
  if (formEditDrawer) {
    formEditDrawer.addEventListener('submit', (e) => e.preventDefault());
  }

  if (btnSaveDrawer) {
    btnSaveDrawer.addEventListener('click', (e) => {
      e.preventDefault();
      if (!activeCustomer) return;

      activeCustomer.firstName = document.getElementById('drawer-firstname')?.value || activeCustomer.firstName;
      activeCustomer.lastName = document.getElementById('drawer-lastname')?.value || activeCustomer.lastName;
      activeCustomer.phoneWhatsapp = document.getElementById('drawer-phone')?.value || activeCustomer.phoneWhatsapp;
      activeCustomer.email = document.getElementById('drawer-email')?.value || '';

      let igVal = document.getElementById('drawer-instagram')?.value || '';
      if (igVal && !igVal.startsWith('@')) igVal = `@${igVal}`;
      activeCustomer.instagram = igVal;

      activeCustomer.address = document.getElementById('drawer-address')?.value || '';
      activeCustomer.birthDate = document.getElementById('drawer-birthdate')?.value || '';
      activeCustomer.preferredChannel = document.getElementById('drawer-channel')?.value || 'WHATSAPP';
      activeCustomer.creditLimit = parseFloat(document.getElementById('drawer-credit-limit')?.value || '30000');
      activeCustomer.notes = document.getElementById('drawer-notes')?.value || '';

      // Actualizar dietas seleccionadas
      const checkedDietBoxes = document.querySelectorAll('.drawer-diet-cb:checked');
      const selectedDietIds = Array.from(checkedDietBoxes).map(cb => cb.value);
      activeCustomer.dietaryProfiles = activeDietaryProfiles.filter(d => selectedDietIds.includes(d.id));

      renderMasterCustomersTable(currentCustomers);
      loadFinanceCustomers();
      drawerBackdrop.classList.remove('active');
      alert(`✅ Cambios guardados para ${activeCustomer.firstName} ${activeCustomer.lastName}.`);
    });
  }

  // Modal Registro de Nuevo Cliente
  const modalRegisterCustomer = document.getElementById('modal-register-customer');
  const btnOpenCustModal = document.getElementById('btn-open-customer-modal');
  const btnCloseCustModal = document.getElementById('btn-close-modal');
  const btnCancelCustModal = document.getElementById('btn-cancel-modal');
  const formRegisterCustomer = document.getElementById('form-register-customer');

  function openRegisterCustomerModal() {
    if (!modalRegisterCustomer) return;
    const regDietContainer = document.getElementById('reg-dietary-checkboxes');
    if (regDietContainer) {
      regDietContainer.innerHTML = activeDietaryProfiles.map(d => `
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
          <input type="checkbox" value="${d.id}" class="reg-diet-cb">
          <span class="diet-tag" style="background-color: ${d.badgeColorHex}; font-size: 10px;">${d.name}</span>
        </label>
      `).join('');
    }
    modalRegisterCustomer.classList.add('active');
  }

  if (btnOpenCustModal) btnOpenCustModal.addEventListener('click', openRegisterCustomerModal);
  if (btnCloseCustModal) btnCloseCustModal.addEventListener('click', () => modalRegisterCustomer?.classList.remove('active'));
  if (btnCancelCustModal) btnCancelCustModal.addEventListener('click', () => modalRegisterCustomer?.classList.remove('active'));

  if (formRegisterCustomer) {
    formRegisterCustomer.addEventListener('submit', (e) => {
      e.preventDefault();
      const fn = document.getElementById('reg-firstname')?.value.trim();
      const ln = document.getElementById('reg-lastname')?.value.trim();
      const ph = document.getElementById('reg-phone')?.value.trim();
      const em = document.getElementById('reg-email')?.value.trim() || '';
      let ig = document.getElementById('reg-instagram')?.value.trim() || '';
      if (ig && !ig.startsWith('@')) ig = `@${ig}`;
      const ad = document.getElementById('reg-address')?.value.trim() || '';
      const bd = document.getElementById('reg-birthdate')?.value || '';
      const ch = document.getElementById('reg-channel')?.value || 'WHATSAPP';
      const notes = document.getElementById('reg-notes')?.value || '';
      const sendWelcome = document.getElementById('reg-send-welcome')?.checked;

      const checkedBoxes = document.querySelectorAll('.reg-diet-cb:checked');
      const selDietIds = Array.from(checkedBoxes).map(cb => cb.value);
      const selectedDiets = activeDietaryProfiles.filter(d => selDietIds.includes(d.id));

      const newCust = {
        id: `c-${Date.now()}`,
        firstName: fn,
        lastName: ln,
        phoneWhatsapp: ph,
        email: em,
        instagram: ig,
        address: ad,
        birthDate: bd,
        preferredChannel: ch,
        segment: 'Ocasional',
        pointsBalance: 100,
        currentAccountBalance: 0,
        creditLimit: 30000,
        notes: notes,
        dietaryProfiles: selectedDiets
      };

      currentCustomers.unshift(newCust);
      renderMasterCustomersTable(currentCustomers);
      populateCustomerSelects();
      loadFinanceCustomers();
      formRegisterCustomer.reset();
      modalRegisterCustomer.classList.remove('active');

      alert(`✅ ¡Cliente "${fn} ${ln}" registrado con éxito en el CRM!${sendWelcome ? '\n📲 Mensaje de Bienvenida enviado por WhatsApp.' : ''}`);
    });
  }

  // -----------------------------------------------------------------------------
  // WHATSAPP MARKETING & CAMPAÑAS SIMULADAS
  // -----------------------------------------------------------------------------
  const formMarketing = document.getElementById('form-create-marketing-campaign');
  const mktTemplateSelect = document.getElementById('mkt-template-select');
  const mktMessageBody = document.getElementById('mkt-message-body');

  if (mktTemplateSelect && mktMessageBody) {
    mktTemplateSelect.addEventListener('change', () => {
      const val = mktTemplateSelect.value;
      if (val === 'BIENVENIDA') mktMessageBody.value = "Hola {nombre}! 🌸 Bienvenida/o a Flor y Ser Almacén Natural. Tenés acumulados {puntos} puntos de bienvenida para tu próxima compra.";
      if (val === 'REPOSICION') mktMessageBody.value = "Hola {nombre}! 🌿 Han pasado 30 días desde tu última compra. Recordá reponer tus insumos saludables con un 10% de descuento.";
      if (val === 'CUMPLEANOS') mktMessageBody.value = "¡Feliz Cumpleaños {nombre}! 🎂 Te regalamos un 15% OFF en todo nuestro catálogo. Tu saldo actual en Cta Cte es {saldo}.";
      if (val === 'DIETA_PROMO') mktMessageBody.value = "Hola {nombre}! 🌱 Ingresaron nuevos productos aptos para tu perfil dietético. ¡Consultanos por delivery a domicilio!";
    });
  }

  if (formMarketing) {
    formMarketing.addEventListener('submit', (e) => {
      e.preventDefault();
      const campaignName = document.getElementById('mkt-campaign-name').value;
      const dietFilter = document.getElementById('mkt-audience-diet').value;

      alert(`🚀 Campaña "${campaignName}" enviada con éxito a ${currentCustomers.length} destinatarios de WhatsApp.`);
      loadMarketingData(true);
    });
  }

  function loadMarketingData(isSent = false) {
    const tbody = document.getElementById('table-marketing-recipients');
    if (!tbody) return;

    tbody.innerHTML = currentCustomers.map(c => `
      <tr>
        <td><strong>${c.firstName} ${c.lastName}</strong></td>
        <td>${c.phoneWhatsapp}</td>
        <td><span class="badge-segment ${c.segment}">${c.segment || 'Frecuente'}</span></td>
        <td><span class="badge" style="background: ${isSent ? '#10B981' : '#F59E0B'}; color: white;">${isSent ? '🟢 Enviado Vía WhatsApp' : '🟡 Listo para Envío'}</span></td>
      </tr>
    `).join('');
  }

  // -----------------------------------------------------------------------------
  // RECEPCIÓN DE MERCADERÍA (INGRESO DE INSUMOS A GRANEL)
  // -----------------------------------------------------------------------------
  const formGoodsReceipt = document.getElementById('form-goods-receipt');
  if (formGoodsReceipt) {
    formGoodsReceipt.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawId = document.getElementById('receipt-raw-material-select').value;
      const qty = parseFloat(document.getElementById('receipt-quantity').value || '0');
      const costPerUnit = parseFloat(document.getElementById('receipt-cost-per-unit').value || '0');
      const invoiceNumber = document.getElementById('receipt-invoice-number').value;

      const rawMat = rawMaterials.find(m => m.id === rawId);
      if (rawMat) {
        rawMat.currentStock = parseFloat((rawMat.currentStock + qty).toFixed(2));
        if (costPerUnit > 0) rawMat.costPerUnit = costPerUnit;

        renderRawMaterialsTable(rawMaterials);
        loadGoodsReceiptData();
        formGoodsReceipt.reset();
        alert(`✅ Recepción registrada: +${qty} ${rawMat.unit} de "${rawMat.name}". Nuevo Stock Total: ${rawMat.currentStock} ${rawMat.unit}. Comprobante: ${invoiceNumber}`);
      } else {
        alert('⚠️ Por favor selecciona un insumo a granel válido.');
      }
    });
  }

  function loadGoodsReceiptData() {
    const suppSelect = document.getElementById('receipt-supplier-select');
    const rawSelect = document.getElementById('receipt-raw-material-select');

    if (suppSelect) {
      suppSelect.innerHTML = `<option value="">-- Seleccionar Proveedor --</option>` + currentSuppliers.map(s => `
        <option value="${s.id}">${s.businessName} (${s.taxId})</option>
      `).join('');
    }

    if (rawSelect) {
      rawSelect.innerHTML = `<option value="">-- Seleccionar Insumo Granel --</option>` + rawMaterials.map(m => `
        <option value="${m.id}">${m.name} (Stock Actual: ${m.currentStock} ${m.unit})</option>
      `).join('');
    }
  }

  // -----------------------------------------------------------------------------
  // MAESTRO DE PROVEEDORES & FICHA EDITABLE
  // -----------------------------------------------------------------------------
  function loadSuppliersData() {
    const tbody = document.getElementById('table-suppliers-list');
    if (!tbody) return;

    tbody.innerHTML = currentSuppliers.map(s => `
      <tr class="supplier-row" data-id="${s.id}" style="cursor: pointer;">
        <td><strong>${s.taxId}</strong></td>
        <td><strong style="color: var(--primary-color);">${s.businessName}</strong></td>
        <td>${s.contactName || 'N/A'}</td>
        <td><strong>${s.phone}</strong></td>
        <td>${s.email || 'N/A'}</td>
        <td><span class="badge" style="background: var(--craft-light); color: var(--text-dark);">${s.commercialTerms}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm btn-edit-supplier" data-id="${s.id}">
            <i data-lucide="edit"></i> Ficha
          </button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit-supplier, .supplier-row').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        const supp = currentSuppliers.find(s => s.id === id);
        if (supp) openSupplierDetailModal(supp);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  const modalSupplierDetail = document.getElementById('modal-supplier-detail');
  const btnCloseSuppDetail = document.getElementById('btn-close-supplier-detail-modal');
  const btnCancelSuppDetail = document.getElementById('btn-cancel-supplier-detail');
  const formEditSupplier = document.getElementById('form-edit-supplier');

  function openSupplierDetailModal(supp) {
    activeSupplierForModal = supp;
    if (!modalSupplierDetail) return;

    document.getElementById('edit-supp-cuit').value = supp.taxId;
    document.getElementById('edit-supp-name').value = supp.businessName;
    document.getElementById('edit-supp-contact').value = supp.contactName || '';
    document.getElementById('edit-supp-phone').value = supp.phone;
    document.getElementById('edit-supp-email').value = supp.email || '';
    document.getElementById('edit-supp-terms').value = supp.commercialTerms || '';
    document.getElementById('supp-detail-balance').innerText = `$${(supp.balance || 0).toLocaleString()}`;

    modalSupplierDetail.classList.add('active');
  }

  if (btnCloseSuppDetail) btnCloseSuppDetail.addEventListener('click', () => modalSupplierDetail.classList.remove('active'));
  if (btnCancelSuppDetail) btnCancelSuppDetail.addEventListener('click', () => modalSupplierDetail.classList.remove('active'));

  if (formEditSupplier) {
    formEditSupplier.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeSupplierForModal) return;

      activeSupplierForModal.taxId = document.getElementById('edit-supp-cuit').value;
      activeSupplierForModal.businessName = document.getElementById('edit-supp-name').value;
      activeSupplierForModal.contactName = document.getElementById('edit-supp-contact').value;
      activeSupplierForModal.phone = document.getElementById('edit-supp-phone').value;
      activeSupplierForModal.email = document.getElementById('edit-supp-email').value;
      activeSupplierForModal.commercialTerms = document.getElementById('edit-supp-terms').value;

      loadSuppliersData();
      modalSupplierDetail.classList.remove('active');
      alert(`✅ Ficha de proveedor "${activeSupplierForModal.businessName}" actualizada.`);
    });
  }

  // Modal Nuevo Proveedor
  const modalSupplier = document.getElementById('modal-new-supplier');
  const btnOpenSupplierModal = document.getElementById('btn-open-supplier-modal');
  const btnCloseSupplierModal = document.getElementById('btn-close-supplier-modal');
  const btnCancelSupplierModal = document.getElementById('btn-cancel-supplier-modal');
  const formCreateSupplier = document.getElementById('form-create-supplier');

  if (btnOpenSupplierModal && modalSupplier) btnOpenSupplierModal.addEventListener('click', () => modalSupplier.classList.add('active'));
  if (btnCloseSupplierModal && modalSupplier) btnCloseSupplierModal.addEventListener('click', () => modalSupplier.classList.remove('active'));
  if (btnCancelSupplierModal && modalSupplier) btnCancelSupplierModal.addEventListener('click', () => modalSupplier.classList.remove('active'));

  if (formCreateSupplier) {
    formCreateSupplier.addEventListener('submit', (e) => {
      e.preventDefault();
      const taxId = document.getElementById('supp-cuit').value;
      const businessName = document.getElementById('supp-name').value;
      const contactName = document.getElementById('supp-contact').value;
      const phone = document.getElementById('supp-phone').value;
      const email = document.getElementById('supp-email').value;
      const commercialTerms = document.getElementById('supp-terms').value;

      const newSupp = { id: 's-' + Date.now(), taxId, businessName, contactName, phone, email, commercialTerms, balance: 0 };
      currentSuppliers.unshift(newSupp);
      loadSuppliersData();
      loadGoodsReceiptData();
      modalSupplier.classList.remove('active');
      formCreateSupplier.reset();
      alert(`✅ Proveedor "${businessName}" creado exitosamente.`);
    });
  }

  // -----------------------------------------------------------------------------
  // INVENTARIO Y CONTROL DOBLE NIVEL
  // -----------------------------------------------------------------------------
  // Modales de Nuevo Insumo Granel y Nuevo Producto Final
  const modalNewRaw = document.getElementById('modal-new-raw-material');
  const btnOpenNewRaw = document.getElementById('btn-open-new-raw-modal');
  const btnCloseNewRaw = document.getElementById('btn-close-raw-modal');
  const btnCancelNewRaw = document.getElementById('btn-cancel-raw-modal');
  const formCreateRaw = document.getElementById('form-create-raw-material');

  const modalNewProd = document.getElementById('modal-new-final-product');
  const btnOpenNewProd = document.getElementById('btn-open-new-product-modal');
  const btnCloseNewProd = document.getElementById('btn-close-product-modal');
  const btnCancelNewProd = document.getElementById('btn-cancel-product-modal');
  const formCreateProd = document.getElementById('form-create-final-product');

  // Toggles de nivel Nivel 1 (Granel) / Nivel 2 (Empaquetado)
  const btnToggleRaw = document.getElementById('btn-toggle-stock-raw');
  const btnToggleFinal = document.getElementById('btn-toggle-stock-final');
  const cardRawMats = document.getElementById('card-raw-materials');
  const cardFinalProds = document.getElementById('card-final-products');

  if (btnToggleRaw && btnToggleFinal && cardRawMats && cardFinalProds) {
    btnToggleRaw.addEventListener('click', () => {
      btnToggleRaw.className = 'btn btn-primary active';
      btnToggleFinal.className = 'btn btn-secondary';
      cardRawMats.style.display = 'block';
      cardFinalProds.style.display = 'none';
    });

    btnToggleFinal.addEventListener('click', () => {
      btnToggleRaw.className = 'btn btn-secondary';
      btnToggleFinal.className = 'btn btn-primary active';
      cardRawMats.style.display = 'none';
      cardFinalProds.style.display = 'block';
    });
  }

  const filterStockLowBtn = document.getElementById('filter-stock-low');
  let isLowStockFiltered = false;

  if (filterStockLowBtn) {
    filterStockLowBtn.addEventListener('click', () => {
      isLowStockFiltered = !isLowStockFiltered;
      if (isLowStockFiltered) {
        filterStockLowBtn.className = 'btn btn-primary btn-sm';
        filterStockLowBtn.innerHTML = '<i data-lucide="filter"></i> Mostrando Solo Stock Bajo (Ver Todos)';
        renderRawMaterialsTable(rawMaterials.filter(m => m.currentStock <= m.minStock));
        renderFinalProductsTable(finalProducts.filter(p => p.currentStock <= p.minStock));
      } else {
        filterStockLowBtn.className = 'btn btn-terracotta btn-sm';
        filterStockLowBtn.innerHTML = '<i data-lucide="alert-triangle"></i> Solo Stock Bajo';
        renderRawMaterialsTable(rawMaterials);
        renderFinalProductsTable(finalProducts);
      }
      if (window.lucide) lucide.createIcons();
    });
  }

  // -----------------------------------------------------------------------------
  // AUTO-GENERACIÓN DE SKU PARA INSUMOS GRANEL Y PRODUCTOS EMPAQUETADOS
  // -----------------------------------------------------------------------------
  function generateAutoSKU(name, prefix) {
    if (!name || name.trim().length === 0) return '';
    const cleanName = name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    let codePart = '';

    if (words.length === 1) {
      codePart = words[0].substring(0, 4);
    } else if (words.length === 2) {
      codePart = words[0].substring(0, 3) + words[1].substring(0, 2);
    } else {
      codePart = words[0].substring(0, 2) + words[1].substring(0, 2) + words[2].substring(0, 2);
    }

    const numMatches = name.match(/\d+/g);
    const numPart = numMatches ? numMatches.join('') : (prefix === 'MP' ? '001' : '100');

    return `${prefix}-${codePart}-${numPart}`;
  }

  const rawNameInput = document.getElementById('raw-name');
  const rawCodeInput = document.getElementById('raw-code');
  if (rawNameInput && rawCodeInput) {
    rawNameInput.addEventListener('input', () => {
      rawCodeInput.value = generateAutoSKU(rawNameInput.value, 'MP');
    });
  }

  const prodNameInput = document.getElementById('prod-name');
  const prodCodeInput = document.getElementById('prod-code');
  const prodBarcodeInput = document.getElementById('prod-barcode');
  if (prodNameInput && prodCodeInput) {
    prodNameInput.addEventListener('input', () => {
      const generatedSKU = generateAutoSKU(prodNameInput.value, 'PF');
      prodCodeInput.value = generatedSKU;
      if (prodBarcodeInput && !prodBarcodeInput.value) {
        prodBarcodeInput.value = `779${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      }
    });
  }

  // Eventos Modal Insumo Granel
  if (btnOpenNewRaw && modalNewRaw) btnOpenNewRaw.addEventListener('click', () => modalNewRaw.classList.add('active'));
  if (btnCloseNewRaw && modalNewRaw) btnCloseNewRaw.addEventListener('click', () => modalNewRaw.classList.remove('active'));
  if (btnCancelNewRaw && modalNewRaw) btnCancelNewRaw.addEventListener('click', () => modalNewRaw.classList.remove('active'));

  if (formCreateRaw) {
    formCreateRaw.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('raw-code')?.value.trim();
      const unit = document.getElementById('raw-unit')?.value.toLowerCase() || 'kg';
      const name = document.getElementById('raw-name')?.value.trim();
      const stock = parseFloat(document.getElementById('raw-stock')?.value || '0');
      const minStock = parseFloat(document.getElementById('raw-min-stock')?.value || '5');
      const cost = parseFloat(document.getElementById('raw-cost')?.value || '0');
      const supplier = document.getElementById('raw-supplier')?.value.trim() || 'N/A';
      const location = document.getElementById('raw-location')?.value.trim() || 'Depósito';

      const newRawItem = {
        id: `rm-${Date.now()}`,
        code: code,
        name: name,
        unit: unit,
        currentStock: stock,
        minStock: minStock,
        costPerUnit: cost,
        supplierName: supplier,
        storageLocation: location
      };

      rawMaterials.unshift(newRawItem);
      renderRawMaterialsTable(rawMaterials);
      loadGoodsReceiptData();
      populateFractioningSelects();
      formCreateRaw.reset();
      modalNewRaw.classList.remove('active');

      alert(`✅ ¡Insumo a granel "${name}" registrado exitosamente en el inventario!`);
    });
  }

  // Eventos Modal Producto Final
  if (btnOpenNewProd && modalNewProd) {
    btnOpenNewProd.addEventListener('click', () => {
      const prodRawSelect = document.getElementById('prod-raw-id');
      if (prodRawSelect) {
        prodRawSelect.innerHTML = `<option value="">-- Sin Vinculación / Insumo Directo --</option>` + rawMaterials.map(m => `
          <option value="${m.id}">${m.name} (${m.code})</option>
        `).join('');
      }

      const prodDietContainer = document.getElementById('prod-diet-checkboxes');
      if (prodDietContainer) {
        prodDietContainer.innerHTML = activeDietaryProfiles.map(d => `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" value="${d.name}" class="prod-diet-cb">
            <span class="diet-tag" style="background-color: ${d.badgeColorHex}; font-size: 10px;">${d.name}</span>
          </label>
        `).join('');
      }

      modalNewProd.classList.add('active');
    });
  }

  if (btnCloseNewProd && modalNewProd) btnCloseNewProd.addEventListener('click', () => modalNewProd.classList.remove('active'));
  if (btnCancelNewProd && modalNewProd) btnCancelNewProd.addEventListener('click', () => modalNewProd.classList.remove('active'));

  if (formCreateProd) {
    formCreateProd.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('prod-code')?.value.trim();
      const barcode = document.getElementById('prod-barcode')?.value.trim() || `779${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const name = document.getElementById('prod-name')?.value.trim();
      const unitWeight = document.getElementById('prod-unit-weight')?.value || '250';
      const netLabel = document.getElementById('prod-net-label')?.value.trim() || `${unitWeight}g`;
      const stock = parseInt(document.getElementById('prod-stock')?.value || '0');
      const minStock = parseInt(document.getElementById('prod-min-stock')?.value || '5');
      const price = parseFloat(document.getElementById('prod-price')?.value || '0');

      const checkedDietBoxes = document.querySelectorAll('.prod-diet-cb:checked');
      const selectedDiets = Array.from(checkedDietBoxes).map(cb => cb.value);

      const newProdItem = {
        id: `fp-${Date.now()}`,
        code: code,
        barcode: barcode,
        name: name,
        netWeightLabel: netLabel,
        currentStock: stock,
        minStock: minStock,
        salePrice: price,
        dietaryProfiles: selectedDiets.length ? selectedDiets : ['Estándar']
      };

      finalProducts.unshift(newProdItem);
      renderFinalProductsTable(finalProducts);
      populateFractioningSelects();
      loadPricingMatrix();
      formCreateProd.reset();
      modalNewProd.classList.remove('active');

      alert(`✅ ¡Producto empaquetado "${name}" registrado exitosamente en el catálogo!`);
    });
  }

  function loadInventoryData() {
    renderRawMaterialsTable(rawMaterials);
    renderFinalProductsTable(finalProducts);
    populateFractioningSelects();
    if (window.lucide) lucide.createIcons();
  }

  function renderRawMaterialsTable(list) {
    const tbody = document.getElementById('table-raw-materials');
    if (!tbody) return;

    tbody.innerHTML = list.map(m => {
      let statusBadge = `<span class="badge" style="background: #10B981; color: white;">Stock Suficiente</span>`;
      if (m.currentStock <= 0) {
        statusBadge = `<span class="badge" style="background: #EF4444; color: white;">Agotado</span>`;
      } else if (m.currentStock <= m.minStock) {
        statusBadge = `<span class="badge" style="background: #F59E0B; color: white;">Stock Crítico</span>`;
      }

      return `
        <tr>
          <td><strong style="color: var(--primary-color);">${m.code}</strong></td>
          <td><strong style="font-size: 14px;">${m.name}</strong></td>
          <td style="font-weight: 700; font-size: 15px;">${m.currentStock} ${m.unit}</td>
          <td>${m.minStock} ${m.unit}</td>
          <td>$${(m.costPerUnit || 0).toLocaleString()}/${m.unit}</td>
          <td>${m.supplierName || 'N/A'}</td>
          <td><small>${m.storageLocation || 'Depósito'}</small></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-raw-adj" data-id="${m.id}" data-delta="5" title="Sumar 5kg">+5</button>
            <button class="btn btn-secondary btn-sm btn-raw-adj" data-id="${m.id}" data-delta="-5" title="Restar 5kg">-5</button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-raw-adj').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const delta = parseFloat(e.target.getAttribute('data-delta'));
        const mat = rawMaterials.find(m => m.id === id);
        if (mat) {
          mat.currentStock = Math.max(0, parseFloat((mat.currentStock + delta).toFixed(2)));
          renderRawMaterialsTable(rawMaterials);
        }
      });
    });
  }

  function renderFinalProductsTable(list) {
    const tbody = document.getElementById('table-final-products');
    if (!tbody) return;

    tbody.innerHTML = list.map(p => {
      let statusBadge = `<span class="badge" style="background: #10B981; color: white;">Disponible</span>`;
      if (p.currentStock <= 0) {
        statusBadge = `<span class="badge" style="background: #EF4444; color: white;">Sin Stock</span>`;
      } else if (p.currentStock <= p.minStock) {
        statusBadge = `<span class="badge" style="background: #F59E0B; color: white;">Bajo Stock</span>`;
      }

      const tagsHtml = (p.dietaryProfiles || []).map(dpName => `
        <span class="diet-tag" style="background-color: var(--primary-color); font-size: 10px;">${dpName}</span>
      `).join(' ');

      return `
        <tr>
          <td><strong style="color: var(--primary-color);">${p.code}</strong></td>
          <td><strong style="font-size: 14px;">${p.name}</strong></td>
          <td>${p.netWeightLabel}</td>
          <td style="font-weight: 700; font-size: 15px;">${p.currentStock} un</td>
          <td>${p.minStock} un</td>
          <td style="font-weight: 700; color: var(--terracotta);">$${(p.salePrice || 0).toLocaleString()}</td>
          <td>${tagsHtml || '<small style="color: var(--text-muted);">Estándar</small>'}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-prod-adj" data-id="${p.id}" data-delta="1">+1</button>
            <button class="btn btn-secondary btn-sm btn-prod-adj" data-id="${p.id}" data-delta="-1">-1</button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-prod-adj').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const delta = parseInt(e.target.getAttribute('data-delta'));
        const prod = finalProducts.find(p => p.id === id);
        if (prod) {
          prod.currentStock = Math.max(0, prod.currentStock + delta);
          renderFinalProductsTable(finalProducts);
        }
      });
    });
  }

  function populateFractioningSelects() {
    const rawSelect = document.getElementById('frac-raw-material-id');
    const finalSelect = document.getElementById('frac-final-product-id');

    if (rawSelect) {
      rawSelect.innerHTML = `<option value="">-- Seleccionar Insumo Granel --</option>` + rawMaterials.map(m => `
        <option value="${m.id}">${m.name} (Stock: ${m.currentStock} ${m.unit})</option>
      `).join('');
    }

    if (finalSelect) {
      finalSelect.innerHTML = `<option value="">-- Seleccionar Producto Final --</option>` + finalProducts.map(p => `
        <option value="${p.id}">${p.name} (${p.netWeightLabel})</option>
      `).join('');
    }
  }

  function loadFractioningData() {
    populateFractioningSelects();
  }

  // Modal Crear Nueva Tarea Kanban
  const modalNewTask = document.getElementById('modal-new-task');
  const btnOpenTaskModal = document.getElementById('btn-open-task-modal');
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
  const btnCancelTaskModal = document.getElementById('btn-cancel-task-modal');
  const formCreateTask = document.getElementById('form-create-task');

  if (btnOpenTaskModal && modalNewTask) btnOpenTaskModal.addEventListener('click', () => modalNewTask.classList.add('active'));
  if (btnCloseTaskModal && modalNewTask) btnCloseTaskModal.addEventListener('click', () => modalNewTask.classList.remove('active'));
  if (btnCancelTaskModal && modalNewTask) btnCancelTaskModal.addEventListener('click', () => modalNewTask.classList.remove('active'));

  if (formCreateTask) {
    formCreateTask.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title')?.value.trim();
      const type = document.getElementById('task-type')?.value || 'FRACTIONING';
      const priority = document.getElementById('task-priority')?.value || 'MEDIUM';
      const operator = document.getElementById('task-operator')?.value.trim() || 'Operario Depósito';

      const newTaskObj = {
        id: `t-${Date.now()}`,
        title: title,
        priority: priority,
        productName: type === 'FRACTIONING' ? 'Fraccionado Insumo' : (type === 'PACKAGING' ? 'Empaque Final' : 'General'),
        batchNumber: `L-${type.substring(0,3)}-${new Date().toISOString().slice(2,7).replace('-','')}`,
        operator: operator,
        targetWeight: 'Según orden',
        notes: 'Tarea creada desde el Kanban.'
      };

      if (!mockTasksBoard.PENDING_FRACTIONING) mockTasksBoard.PENDING_FRACTIONING = [];
      mockTasksBoard.PENDING_FRACTIONING.unshift(newTaskObj);

      renderTaskKanbanBoard(mockTasksBoard);
      formCreateTask.reset();
      modalNewTask.classList.remove('active');

      alert(`✅ Nueva tarea "${title}" creada con éxito en la columna "Pendiente de Fraccionar".`);
    });
  }

  // -----------------------------------------------------------------------------
  // KANBAN DE TAREAS OPERATIVAS & VISOR DE DETALLES DE TAREA
  // -----------------------------------------------------------------------------
  const modalTaskDetail = document.getElementById('modal-task-detail');
  const btnCloseTaskDetail = document.getElementById('btn-close-task-detail-modal');
  const btnCancelTaskDetail = document.getElementById('btn-cancel-task-detail');
  const btnAdvanceTaskModal = document.getElementById('btn-advance-task-modal');

  function openTaskDetailModal(task) {
    activeTaskForModal = task;
    if (!modalTaskDetail) return;

    document.getElementById('task-detail-title').innerText = task.title;
    document.getElementById('task-detail-priority').innerText = task.priority || 'NORMAL';
    document.getElementById('task-detail-product').innerText = task.productName || 'General';
    document.getElementById('task-detail-operator').innerText = task.operator || 'Juan Pérez (Planta)';
    document.getElementById('task-detail-batch').innerText = task.batchNumber || 'L-ALM-2026-07';
    document.getElementById('task-detail-target').innerText = task.targetWeight || '25.00 kg';
    document.getElementById('task-detail-notes').value = task.notes || '';

    modalTaskDetail.classList.add('active');
  }

  if (btnCloseTaskDetail) btnCloseTaskDetail.addEventListener('click', () => modalTaskDetail.classList.remove('active'));
  if (btnCancelTaskDetail) btnCancelTaskDetail.addEventListener('click', () => modalTaskDetail.classList.remove('active'));

  if (btnAdvanceTaskModal) {
    btnAdvanceTaskModal.addEventListener('click', () => {
      if (activeTaskForModal) {
        moveTaskNextStage(activeTaskForModal.id);
        modalTaskDetail.classList.remove('active');
      }
    });
  }

  function moveTaskNextStage(taskId) {
    const stages = ['PENDING_FRACTIONING', 'PACKAGING_IN_PROGRESS', 'QUALITY_CONTROL', 'COMPLETED'];
    let foundTask = null;
    let currentStageIdx = -1;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const idx = (mockTasksBoard[stage] || []).findIndex(t => t.id === taskId);
      if (idx !== -1) {
        foundTask = mockTasksBoard[stage].splice(idx, 1)[0];
        currentStageIdx = i;
        break;
      }
    }

    if (foundTask && currentStageIdx !== -1) {
      const nextStageIdx = Math.min(stages.length - 1, currentStageIdx + 1);
      const nextStage = stages[nextStageIdx];
      if (!mockTasksBoard[nextStage]) mockTasksBoard[nextStage] = [];
      mockTasksBoard[nextStage].push(foundTask);
      renderTaskKanbanBoard(mockTasksBoard);
    }
  }

  function renderTaskKanbanBoard(board) {
    const colPending = document.getElementById('cards-pending-fractioning');
    const colPackaging = document.getElementById('cards-packaging-progress');
    const colQuality = document.getElementById('cards-quality-control');
    const colCompleted = document.getElementById('cards-task-completed');

    const renderCards = (tasks, stageName, isLastStage = false) => (tasks || []).map(t => `
      <div class="kanban-card task-card-item" data-id="${t.id}" style="cursor: pointer;">
        <div class="kanban-card-title">${t.title}</div>
        <div style="font-size: 11px; color: var(--primary-color); font-weight: 600;">${t.productName || 'General'}</div>
        <div class="kanban-card-meta" style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span class="badge" style="background: var(--craft-light); font-size: 10px;">${t.priority || 'NORMAL'}</span>
          ${!isLastStage ? `<button class="btn btn-primary btn-sm btn-move-task" data-id="${t.id}" style="padding: 2px 8px; font-size: 10px;">Avanzar ➔</button>` : `<span class="badge" style="background: #10B981; color: white; font-size: 10px;">Completado</span>`}
        </div>
      </div>
    `).join('');

    if (colPending) colPending.innerHTML = renderCards(board.PENDING_FRACTIONING, 'Pendiente');
    if (colPackaging) colPackaging.innerHTML = renderCards(board.PACKAGING_IN_PROGRESS, 'En Proceso');
    if (colQuality) colQuality.innerHTML = renderCards(board.QUALITY_CONTROL, 'Control Calidad');
    if (colCompleted) colCompleted.innerHTML = renderCards(board.COMPLETED, 'Finalizado', true);

    document.querySelectorAll('.task-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-move-task')) return;
        const id = card.getAttribute('data-id');
        let task = null;
        Object.values(board).forEach(arr => {
          const t = (arr || []).find(x => x.id === id);
          if (t) task = t;
        });
        if (task) openTaskDetailModal(task);
      });
    });

    document.querySelectorAll('.btn-move-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        moveTaskNextStage(id);
      });
    });

    const elP = document.getElementById('count-pending-fractioning'); if (elP) elP.innerText = (board.PENDING_FRACTIONING || []).length;
    const elK = document.getElementById('count-packaging-progress'); if (elK) elK.innerText = (board.PACKAGING_IN_PROGRESS || []).length;
    const elQ = document.getElementById('count-quality-control'); if (elQ) elQ.innerText = (board.QUALITY_CONTROL || []).length;
    const elC = document.getElementById('count-task-completed'); if (elC) elC.innerText = (board.COMPLETED || []).length;
  }

  // -----------------------------------------------------------------------------
  // VENTAS & KANBAN DE PEDIDOS (DESCUENTO DE STOCK REAL Y VISOR DE DETALLES)
  // -----------------------------------------------------------------------------
  const modalOrderDetail = document.getElementById('modal-order-detail');
  const btnCloseOrderDetail = document.getElementById('btn-close-order-detail-modal');
  const btnCancelOrderDetail = document.getElementById('btn-cancel-order-detail');
  const btnAdvanceOrderModal = document.getElementById('btn-advance-order-modal');

  function openOrderDetailModal(order) {
    activeOrderForModal = order;
    if (!modalOrderDetail) return;

    document.getElementById('order-detail-number').innerText = order.orderNumber;
    document.getElementById('order-detail-date').innerText = `Fecha: ${order.date || '2026-07-25'}`;
    document.getElementById('order-detail-customer').innerText = order.customerName;
    document.getElementById('order-detail-phone').innerText = order.phone || '+5491133445566';
    document.getElementById('order-detail-address').innerText = order.address || 'Retiro por Local Mostrador';
    document.getElementById('order-detail-payment').innerText = order.payment || 'Efectivo';
    document.getElementById('order-detail-total').innerText = `$${(order.totalAmount || 0).toLocaleString()}`;

    const itemsTbody = document.getElementById('order-detail-items');
    if (itemsTbody) {
      itemsTbody.innerHTML = (order.items || []).map(it => `
        <tr>
          <td><strong>${it.name}</strong></td>
          <td>${it.qty} un</td>
          <td>$${it.price.toLocaleString()}</td>
          <td style="font-weight: 700;">$${it.subtotal.toLocaleString()}</td>
        </tr>
      `).join('');
    }

    modalOrderDetail.classList.add('active');
  }

  if (btnCloseOrderDetail) btnCloseOrderDetail.addEventListener('click', () => modalOrderDetail.classList.remove('active'));
  if (btnCancelOrderDetail) btnCancelOrderDetail.addEventListener('click', () => modalOrderDetail.classList.remove('active'));

  if (btnAdvanceOrderModal) {
    btnAdvanceOrderModal.addEventListener('click', () => {
      if (activeOrderForModal) {
        moveOrderNextStage(activeOrderForModal.id);
        modalOrderDetail.classList.remove('active');
      }
    });
  }

  function moveOrderNextStage(orderId) {
    const stages = ['RECEIVED', 'IN_PREPARATION', 'READY_FOR_DELIVERY', 'IN_DELIVERY', 'DELIVERED'];
    let foundOrder = null;
    let currentStageIdx = -1;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const idx = (mockSalesBoard[stage] || []).findIndex(o => o.id === orderId);
      if (idx !== -1) {
        foundOrder = mockSalesBoard[stage].splice(idx, 1)[0];
        currentStageIdx = i;
        break;
      }
    }

    if (foundOrder && currentStageIdx !== -1) {
      const nextStageIdx = Math.min(stages.length - 1, currentStageIdx + 1);
      const nextStage = stages[nextStageIdx];
      if (!mockSalesBoard[nextStage]) mockSalesBoard[nextStage] = [];
      mockSalesBoard[nextStage].push(foundOrder);
      renderSalesKanbanBoard(mockSalesBoard);
    }
  }

  function renderSalesKanbanBoard(board) {
    const colReceived = document.getElementById('cards-order-received');
    const colPrep = document.getElementById('cards-order-prep');
    const colReady = document.getElementById('cards-order-ready');
    const colDelivery = document.getElementById('cards-order-delivery');
    const colDelivered = document.getElementById('cards-order-delivered');

    const renderOrderCards = (orders, isLastStage = false) => (orders || []).map(o => `
      <div class="kanban-card order-card-item" data-id="${o.id}" style="cursor: pointer;">
        <div class="kanban-card-title">${o.orderNumber || o.id}</div>
        <div style="font-size: 13px; font-weight: 600;">${o.customerName}</div>
        <div class="kanban-card-meta" style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: var(--terracotta);">$${(o.totalAmount || 0).toLocaleString()}</span>
          ${!isLastStage ? `<button class="btn btn-primary btn-sm btn-move-order" data-id="${o.id}" style="padding: 2px 8px; font-size: 10px;">Avanzar ➔</button>` : `<span class="badge" style="background: #10B981; color: white; font-size: 10px;">Entregado</span>`}
        </div>
      </div>
    `).join('');

    if (colReceived) colReceived.innerHTML = renderOrderCards(board.RECEIVED);
    if (colPrep) colPrep.innerHTML = renderOrderCards(board.IN_PREPARATION);
    if (colReady) colReady.innerHTML = renderOrderCards(board.READY_FOR_DELIVERY);
    if (colDelivery) colDelivery.innerHTML = renderOrderCards(board.IN_DELIVERY);
    if (colDelivered) colDelivered.innerHTML = renderOrderCards(board.DELIVERED, true);

    document.querySelectorAll('.order-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-move-order')) return;
        const id = card.getAttribute('data-id');
        let order = null;
        Object.values(board).forEach(arr => {
          const o = (arr || []).find(x => x.id === id);
          if (o) order = o;
        });
        if (order) openOrderDetailModal(order);
      });
    });

    document.querySelectorAll('.btn-move-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        moveOrderNextStage(id);
      });
    });

    const elRec = document.getElementById('count-order-received'); if (elRec) elRec.innerText = (board.RECEIVED || []).length;
    const elPrp = document.getElementById('count-order-prep'); if (elPrp) elPrp.innerText = (board.IN_PREPARATION || []).length;
    const elRdy = document.getElementById('count-order-ready'); if (elRdy) elRdy.innerText = (board.READY_FOR_DELIVERY || []).length;
    const elDel = document.getElementById('count-order-delivery'); if (elDel) elDel.innerText = (board.IN_DELIVERY || []).length;
    const elFin = document.getElementById('count-order-delivered'); if (elFin) elFin.innerText = (board.DELIVERED || []).length;
  }

  // Formulario Registro de Venta
  const btnAddSaleItem = document.getElementById('btn-add-sale-item');
  const saleItemsTbody = document.getElementById('sale-items-tbody');
  const saleGrandTotalEl = document.getElementById('sale-grand-total');
  const formNewOrder = document.getElementById('form-new-order');

  function addSaleItemRow() {
    if (!saleItemsTbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select class="form-control item-product-select">
          <option value="">-- Seleccionar Producto --</option>
          ${finalProducts.map(p => `<option value="${p.id}" data-price="${p.salePrice || 0}">${p.name} (${p.netWeightLabel || ''}) - Stock: ${p.currentStock} un</option>`).join('')}
        </select>
      </td>
      <td>
        <input type="number" class="form-control item-qty" value="1" min="1" style="width: 80px;">
      </td>
      <td>
        <input type="number" class="form-control item-price" value="0" step="0.01">
      </td>
      <td style="font-weight: 700;" class="item-subtotal">$0</td>
      <td>
        <button type="button" class="btn btn-secondary btn-sm btn-remove-item">&times;</button>
      </td>
    `;

    saleItemsTbody.appendChild(row);

    const prodSelect = row.querySelector('.item-product-select');
    const qtyInput = row.querySelector('.item-qty');
    const priceInput = row.querySelector('.item-price');
    const btnRemove = row.querySelector('.btn-remove-item');

    prodSelect.addEventListener('change', () => {
      const selectedOption = prodSelect.options[prodSelect.selectedIndex];
      const price = parseFloat(selectedOption.getAttribute('data-price') || '0');
      priceInput.value = price;
      calculateSaleTotals();
    });

    qtyInput.addEventListener('input', calculateSaleTotals);
    priceInput.addEventListener('input', calculateSaleTotals);
    btnRemove.addEventListener('click', () => {
      row.remove();
      calculateSaleTotals();
    });

    calculateSaleTotals();
  }

  if (btnAddSaleItem) btnAddSaleItem.addEventListener('click', addSaleItemRow);

  function calculateSaleTotals() {
    if (!saleItemsTbody) return;
    let grandTotal = 0;

    const rows = saleItemsTbody.querySelectorAll('tr');
    rows.forEach(r => {
      const qty = parseFloat(r.querySelector('.item-qty')?.value || '0');
      const price = parseFloat(r.querySelector('.item-price')?.value || '0');
      const subtotal = qty * price;

      const subtotalEl = r.querySelector('.item-subtotal');
      if (subtotalEl) subtotalEl.innerText = `$${subtotal.toLocaleString()}`;

      grandTotal += subtotal;
    });

    const discount = parseFloat(document.getElementById('sale-discount')?.value || '0');
    const shipping = parseFloat(document.getElementById('sale-shipping-fee')?.value || '0');
    grandTotal = Math.max(0, grandTotal - discount + shipping);

    if (saleGrandTotalEl) saleGrandTotalEl.innerText = `$${grandTotal.toLocaleString()}`;
  }

  document.getElementById('sale-discount')?.addEventListener('input', calculateSaleTotals);
  document.getElementById('sale-shipping-fee')?.addEventListener('input', calculateSaleTotals);

  if (formNewOrder) {
    formNewOrder.addEventListener('submit', (e) => {
      e.preventDefault();
      const customerId = document.getElementById('sale-customer-select').value;
      const cust = currentCustomers.find(c => c.id === customerId);
      const customerName = cust ? `${cust.firstName} ${cust.lastName}` : 'Cliente Mostrador';
      const orderNumber = 'PED-' + Math.floor(1000 + Math.random() * 9000);

      // Verificación y Descuento de Stock Real
      const itemsList = [];
      let stockValid = true;

      const rows = saleItemsTbody.querySelectorAll('tr');
      rows.forEach(r => {
        const prodId = r.querySelector('.item-product-select').value;
        const qty = parseInt(r.querySelector('.item-qty').value || '1');
        const price = parseFloat(r.querySelector('.item-price').value || '0');
        const prod = finalProducts.find(p => p.id === prodId);

        if (prod) {
          if (prod.currentStock < qty) {
            alert(`⚠️ Stock insuficiente para "${prod.name}". Stock disponible: ${prod.currentStock} un.`);
            stockValid = false;
          } else {
            itemsList.push({ id: prod.id, name: prod.name, qty, price, subtotal: qty * price, prodObj: prod });
          }
        }
      });

      if (!stockValid) return;

      // Descontar stock real
      itemsList.forEach(it => {
        it.prodObj.currentStock -= it.qty;
      });
      renderFinalProductsTable(finalProducts);

      const grandTotalText = saleGrandTotalEl ? saleGrandTotalEl.innerText.replace('$', '').replace(/\./g, '') : '0';
      const totalAmount = parseFloat(grandTotalText) || 0;

      const newOrder = {
        id: 'ord-' + Date.now(),
        orderNumber,
        customerName,
        phone: cust ? cust.phoneWhatsapp : '+5491100000000',
        address: cust ? cust.address : 'Mostrador',
        payment: document.getElementById('sale-payment-select')?.value || 'Efectivo',
        items: itemsList,
        totalAmount,
        date: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      mockSalesBoard.RECEIVED.push(newOrder);
      renderSalesKanbanBoard(mockSalesBoard);

      alert(`✅ Venta #${orderNumber} registrada con éxito. Stock descontado del inventario.`);
      formNewOrder.reset();
      if (saleItemsTbody) saleItemsTbody.innerHTML = '';
      addSaleItemRow();
    });
  }

  function loadSalesFormData() {
    populateCustomerSelects();
    if (saleItemsTbody && saleItemsTbody.rows.length === 0) {
      addSaleItemRow();
    }
  }

  // -----------------------------------------------------------------------------
  // CTA CTE CLIENTES, PROVEEDORES & GASTOS OPERATIVOS
  // -----------------------------------------------------------------------------
  function loadFinanceCustomers() {
    const tbody = document.getElementById('table-finance-customers-list');
    if (!tbody) return;

    tbody.innerHTML = currentCustomers.map(c => {
      const debtColor = c.currentAccountBalance > 0 ? '#EF4444' : '#10B981';
      const debtText = c.currentAccountBalance > 0 ? `$${c.currentAccountBalance.toLocaleString()}` : '$0 (Al día)';
      const statusBadge = c.currentAccountBalance > 0 
        ? `<span class="badge" style="background: #EF4444; color: white;">Saldo Deudor</span>`
        : `<span class="badge" style="background: #10B981; color: white;">Al Día</span>`;

      return `
        <tr>
          <td><strong>${c.firstName} ${c.lastName}</strong></td>
          <td>${c.phoneWhatsapp}</td>
          <td>$${(c.creditLimit || 30000).toLocaleString()}</td>
          <td style="font-weight: 700; color: ${debtColor};">${debtText}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-cust-statement" data-id="${c.id}"><i data-lucide="message-square"></i> Extracto WA</button>
            <button class="btn btn-primary btn-sm btn-cust-pay" data-id="${c.id}"><i data-lucide="dollar-sign"></i> Cobrar</button>
          </td>
        </tr>
      `;
    }).join('');

    // Extracto WA Click Listener
    document.querySelectorAll('.btn-cust-statement').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').getAttribute('data-id');
        const cust = currentCustomers.find(c => c.id === id);
        if (cust) openWhatsAppStatementModal(cust);
      });
    });

    // Cobrar Click Listener
    document.querySelectorAll('.btn-cust-pay').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').getAttribute('data-id');
        const cust = currentCustomers.find(c => c.id === id);
        if (cust) openCustomerPaymentModal(cust);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Modal Extracto WhatsApp
  const modalWaStatement = document.getElementById('modal-whatsapp-statement');
  const btnCloseWa = document.getElementById('btn-close-wa-modal');
  const btnCopyWa = document.getElementById('btn-copy-wa-statement');
  const btnSendWaDirect = document.getElementById('btn-send-wa-direct');
  const waStatementText = document.getElementById('wa-statement-text');

  function openWhatsAppStatementModal(cust) {
    const msg = `Hola ${cust.firstName} ${cust.lastName}! 🌸 Te enviamos el resumen de tu cuenta corriente en Flor y Ser:\n\n- Saldo Deudor: $${(cust.currentAccountBalance || 0).toLocaleString()}\n- Límite de Crédito: $${(cust.creditLimit || 30000).toLocaleString()}\n- Puntos Acumulados: ${cust.pointsBalance || 0} pts\n\nPodés realizar tu pago por CBU o Mercado Pago. ¡Muchas gracias!`;
    if (waStatementText) waStatementText.value = msg;

    if (btnSendWaDirect) {
      const cleanPhone = (cust.phoneWhatsapp || '').replace(/\+/g, '').replace(/\s+/g, '');
      btnSendWaDirect.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    }

    if (modalWaStatement) modalWaStatement.classList.add('active');
  }

  if (btnCloseWa) btnCloseWa.addEventListener('click', () => modalWaStatement.classList.remove('active'));
  if (btnCopyWa) {
    btnCopyWa.addEventListener('click', () => {
      if (waStatementText) {
        waStatementText.select();
        document.execCommand('copy');
        alert('📋 Mensaje de resumen copiado al portapapeles.');
      }
    });
  }

  // Modal Registrar Cobro a Cliente
  const modalCustPay = document.getElementById('modal-customer-payment');
  const btnCloseCustPay = document.getElementById('btn-close-cust-pay-modal');
  const btnCancelCustPay = document.getElementById('btn-cancel-cust-pay');
  const formCustPay = document.getElementById('form-register-customer-payment');

  function openCustomerPaymentModal(cust) {
    activeCustPaymentModal = cust;
    if (!modalCustPay) return;

    document.getElementById('cust-pay-name').innerText = `Cliente: ${cust.firstName} ${cust.lastName}`;
    document.getElementById('cust-pay-debt').innerText = `$${(cust.currentAccountBalance || 0).toLocaleString()}`;
    document.getElementById('cust-pay-amount').value = cust.currentAccountBalance || 0;

    modalCustPay.classList.add('active');
  }

  if (btnCloseCustPay) btnCloseCustPay.addEventListener('click', () => modalCustPay.classList.remove('active'));
  if (btnCancelCustPay) btnCancelCustPay.addEventListener('click', () => modalCustPay.classList.remove('active'));

  if (formCustPay) {
    formCustPay.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeCustPaymentModal) return;

      const amount = parseFloat(document.getElementById('cust-pay-amount').value || '0');
      activeCustPaymentModal.currentAccountBalance = Math.max(0, activeCustPaymentModal.currentAccountBalance - amount);

      loadFinanceCustomers();
      renderMasterCustomersTable(currentCustomers);
      modalCustPay.classList.remove('active');
      alert(`✅ Cobro de $${amount.toLocaleString()} registrado. Saldo deudor actualizado.`);
    });
  }

  // -----------------------------------------------------------------------------
  // CTA CTE PROVEEDORES & REGISTRO DE PAGOS
  // -----------------------------------------------------------------------------
  function loadFinanceSuppliers() {
    const tbody = document.getElementById('table-finance-suppliers-list');
    if (!tbody) return;

    tbody.innerHTML = currentSuppliers.map(s => {
      const debtColor = s.balance > 0 ? '#EF4444' : '#10B981';
      const debtText = s.balance > 0 ? `$${s.balance.toLocaleString()}` : '$0 (Al día)';
      const statusBadge = s.balance > 0 
        ? `<span class="badge" style="background: #EF4444; color: white;">Deuda Pendiente</span>`
        : `<span class="badge" style="background: #10B981; color: white;">Sin Deudas</span>`;

      return `
        <tr>
          <td><strong>${s.businessName}</strong></td>
          <td>${s.taxId}</td>
          <td>2026-07-10</td>
          <td>2026-08-10</td>
          <td>$${(s.balance || 0).toLocaleString()}</td>
          <td style="font-weight: 700; color: ${debtColor};">${debtText}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-primary btn-sm btn-supp-pay" data-id="${s.id}"><i data-lucide="check"></i> Registrar Pago</button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-supp-pay').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').getAttribute('data-id');
        const supp = currentSuppliers.find(s => s.id === id);
        if (supp) openSupplierPaymentModal(supp);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Modal Registrar Pago a Proveedor
  const modalSuppPay = document.getElementById('modal-supplier-payment');
  const btnCloseSuppPay = document.getElementById('btn-close-supp-pay-modal');
  const btnCancelSuppPay = document.getElementById('btn-cancel-supp-pay');
  const formSuppPay = document.getElementById('form-register-supplier-payment');

  function openSupplierPaymentModal(supp) {
    activeSuppPaymentModal = supp;
    if (!modalSuppPay) return;

    document.getElementById('supp-pay-name').innerText = `Proveedor: ${supp.businessName}`;
    document.getElementById('supp-pay-debt').innerText = `$${(supp.balance || 0).toLocaleString()}`;
    document.getElementById('supp-pay-amount').value = supp.balance || 0;

    modalSuppPay.classList.add('active');
  }

  if (btnCloseSuppPay) btnCloseSuppPay.addEventListener('click', () => modalSuppPay.classList.remove('active'));
  if (btnCancelSuppPay) btnCancelSuppPay.addEventListener('click', () => modalSuppPay.classList.remove('active'));

  if (formSuppPay) {
    formSuppPay.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeSuppPaymentModal) return;

      const amount = parseFloat(document.getElementById('supp-pay-amount').value || '0');
      activeSuppPaymentModal.balance = Math.max(0, activeSuppPaymentModal.balance - amount);

      loadFinanceSuppliers();
      modalSuppPay.classList.remove('active');
      alert(`✅ Pago de $${amount.toLocaleString()} registrado a favor de ${activeSuppPaymentModal.businessName}.`);
    });
  }

  // -----------------------------------------------------------------------------
  // GASTOS OPERATIVOS CON ELIMINACIÓN Y EDICIÓN
  // -----------------------------------------------------------------------------
  function loadExpensesData() {
    const tbody = document.getElementById('table-expenses-list');
    if (!tbody) return;

    tbody.innerHTML = operatingExpenses.map((exp, idx) => `
      <tr>
        <td><strong>${exp.date}</strong></td>
        <td><span class="badge" style="background: var(--craft-light); color: var(--text-dark);">${exp.category}</span></td>
        <td>${exp.description}</td>
        <td><small>${exp.method}</small></td>
        <td style="font-weight: 700; color: var(--terracotta);">$${exp.amount.toLocaleString()}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-delete-expense" data-idx="${idx}">&times;</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        operatingExpenses.splice(idx, 1);
        loadExpensesData();
      });
    });
  }

  // -----------------------------------------------------------------------------
  // SUBPESTAÑAS DE GASTOS OPERATIVOS
  // -----------------------------------------------------------------------------
  const btnExpenseSubList = document.getElementById('btn-expense-subtab-list');
  const btnExpenseSubNew = document.getElementById('btn-expense-subtab-new');
  const btnExpenseSubStats = document.getElementById('btn-expense-subtab-stats');

  const expenseViewList = document.getElementById('expense-view-list');
  const expenseViewNew = document.getElementById('expense-view-new');
  const expenseViewStats = document.getElementById('expense-view-stats');

  function switchExpenseSubtab(activeBtn, activeView) {
    [btnExpenseSubList, btnExpenseSubNew, btnExpenseSubStats].forEach(b => {
      if (b) b.className = 'btn btn-secondary';
    });
    [expenseViewList, expenseViewNew, expenseViewStats].forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (activeBtn) activeBtn.className = 'btn btn-primary active';
    if (activeView) activeView.style.display = 'block';

    if (activeView === expenseViewStats) renderExpensesCategoryStats();
  }

  if (btnExpenseSubList) btnExpenseSubList.addEventListener('click', () => switchExpenseSubtab(btnExpenseSubList, expenseViewList));
  if (btnExpenseSubNew) btnExpenseSubNew.addEventListener('click', () => switchExpenseSubtab(btnExpenseSubNew, expenseViewNew));
  if (btnExpenseSubStats) btnExpenseSubStats.addEventListener('click', () => switchExpenseSubtab(btnExpenseSubStats, expenseViewStats));

  function renderExpensesCategoryStats() {
    const container = document.getElementById('expenses-category-breakdown-list');
    if (!container) return;

    const categoryTotals = {};
    let totalExpenseSum = 0;

    operatingExpenses.forEach(exp => {
      const cat = exp.category || 'OTROS';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
      totalExpenseSum += exp.amount;
    });

    const categories = Object.keys(categoryTotals);
    if (categories.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px;">No hay gastos registrados para analizar.</div>`;
      return;
    }

    container.innerHTML = categories.map(cat => {
      const amt = categoryTotals[cat];
      const pct = totalExpenseSum > 0 ? Math.round((amt / totalExpenseSum) * 100) : 0;
      return `
        <div style="background: var(--bg-linen); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
            <strong>${cat}</strong>
            <span style="font-weight: 700; color: var(--terracotta);">$${amt.toLocaleString()} (${pct}%)</span>
          </div>
          <div style="background: #E2E8F0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: var(--terracotta); width: ${pct}%; height: 100%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // -----------------------------------------------------------------------------
  // SUBPESTAÑAS Y CALCULADORA DE MANO DE OBRA DE FRACCIONADO
  // -----------------------------------------------------------------------------
  const btnFracSubExecute = document.getElementById('btn-frac-subtab-execute');
  const btnFracSubHistory = document.getElementById('btn-frac-subtab-history');
  const btnFracSubCalc = document.getElementById('btn-frac-subtab-calc');

  const fracViewExecute = document.getElementById('frac-view-execute');
  const fracViewHistory = document.getElementById('frac-view-history');
  const fracViewCalc = document.getElementById('frac-view-calc');

  function switchFracSubtab(activeBtn, activeView) {
    [btnFracSubExecute, btnFracSubHistory, btnFracSubCalc].forEach(b => {
      if (b) b.className = 'btn btn-secondary';
    });
    [fracViewExecute, fracViewHistory, fracViewCalc].forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (activeBtn) activeBtn.className = 'btn btn-primary active';
    if (activeView) activeView.style.display = 'block';
  }

  if (btnFracSubExecute) btnFracSubExecute.addEventListener('click', () => switchFracSubtab(btnFracSubExecute, fracViewExecute));
  if (btnFracSubHistory) btnFracSubHistory.addEventListener('click', () => switchFracSubtab(btnFracSubHistory, fracViewHistory));
  if (btnFracSubCalc) btnFracSubCalc.addEventListener('click', () => switchFracSubtab(btnFracSubCalc, fracViewCalc));

  function recalculateFractioningLaborCost() {
    const minutes = parseFloat(document.getElementById('frac-time-minutes')?.value || '45');
    const hourlyRate = parseFloat(document.getElementById('frac-operator-rate')?.value || '2400');
    const units = parseInt(document.getElementById('frac-actual-units')?.value || '1');

    const totalLaborCost = Math.round((minutes / 60) * hourlyRate);
    const unitLaborCost = units > 0 ? (totalLaborCost / units).toFixed(2) : '0.00';

    const totalElem = document.getElementById('frac-calculated-labor-total');
    const unitElem = document.getElementById('frac-calculated-labor-per-unit');

    if (totalElem) totalElem.innerText = `$${totalLaborCost.toLocaleString()}`;
    if (unitElem) unitElem.innerText = `$${unitLaborCost} / un`;
  }

  ['frac-time-minutes', 'frac-operator-rate', 'frac-actual-units'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.addEventListener('input', recalculateFractioningLaborCost);
  });

  function recalculateFracSim() {
    const min = parseFloat(document.getElementById('sim-time-min')?.value || '60');
    const rate = parseFloat(document.getElementById('sim-rate-hr')?.value || '2400');
    const units = parseInt(document.getElementById('sim-units-prod')?.value || '80');

    const totalCost = Math.round((min / 60) * rate);
    const unitCost = units > 0 ? (totalCost / units).toFixed(2) : '0.00';

    const totalElem = document.getElementById('sim-total-labor-cost');
    const unitElem = document.getElementById('sim-unit-labor-cost');

    if (totalElem) totalElem.innerText = `$${totalCost.toLocaleString()}`;
    if (unitElem) unitElem.innerText = `$${unitCost} / unidad`;
  }

  ['sim-time-min', 'sim-rate-hr', 'sim-units-prod'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.addEventListener('input', recalculateFracSim);
  });

  // -----------------------------------------------------------------------------
  // DASHBOARD GENERAL EDITABLE & CENTRO DE CONTROL
  // -----------------------------------------------------------------------------
  let dashboardGoals = {
    salesGoal: 1200000,
    ticketGoal: 15000,
    minStockAlert: 5
  };

  function loadDashboardData() {
    // Calcular Ventas Totales
    let totalSales = 845000;
    const salesGoal = dashboardGoals.salesGoal || 1200000;
    const salesPct = Math.min(100, Math.round((totalSales / salesGoal) * 1000) / 10);

    const salesValElem = document.getElementById('dash-sales-val');
    const salesGoalElem = document.getElementById('dash-sales-goal-text');
    const salesPctElem = document.getElementById('dash-sales-pct');
    const salesBarElem = document.getElementById('dash-sales-bar');

    if (salesValElem) salesValElem.innerText = `$${totalSales.toLocaleString()}`;
    if (salesGoalElem) salesGoalElem.innerText = `$${salesGoal.toLocaleString()}`;
    if (salesPctElem) salesPctElem.innerText = `${salesPct}%`;
    if (salesBarElem) salesBarElem.style.width = `${salesPct}%`;

    // Ticket Promedio
    let ticketAvg = 14083;
    const ticketGoal = dashboardGoals.ticketGoal || 15000;
    const ticketPct = Math.min(100, Math.round((ticketAvg / ticketGoal) * 1000) / 10);

    const ticketValElem = document.getElementById('dash-ticket-val');
    const ticketGoalElem = document.getElementById('dash-ticket-goal-text');
    const ticketPctElem = document.getElementById('dash-ticket-pct');
    const ticketBarElem = document.getElementById('dash-ticket-bar');

    if (ticketValElem) ticketValElem.innerText = `$${ticketAvg.toLocaleString()}`;
    if (ticketGoalElem) ticketGoalElem.innerText = `$${ticketGoal.toLocaleString()}`;
    if (ticketPctElem) ticketPctElem.innerText = `${ticketPct}%`;
    if (ticketBarElem) ticketBarElem.style.width = `${ticketPct}%`;

    // Clientes
    const custCountElem = document.getElementById('dash-cust-count');
    if (custCountElem) custCountElem.innerText = `${currentCustomers.length} Activos`;

    // Valor Total Inventario
    const rawVal = rawMaterials.reduce((acc, m) => acc + (m.currentStock * (m.costPerUnit || 0)), 0);
    const finalVal = finalProducts.reduce((acc, p) => acc + (p.currentStock * (p.salePrice || 0)), 0);
    const totalInvVal = Math.round(rawVal + finalVal);

    const invValElem = document.getElementById('dash-inventory-val');
    if (invValElem) invValElem.innerText = `$${totalInvVal.toLocaleString()}`;

    // Tabla Alertas de Stock Bajo
    const alertTbody = document.getElementById('dash-table-stock-alerts');
    if (alertTbody) {
      const lowRaw = rawMaterials.filter(m => m.currentStock <= m.minStock).map(m => ({ name: m.name, type: 'Granel', stock: `${m.currentStock} ${m.unit}`, status: 'Bajo Stock' }));
      const lowProd = finalProducts.filter(p => p.currentStock <= p.minStock).map(p => ({ name: p.name, type: 'Empaquetado', stock: `${p.currentStock} un`, status: 'Bajo Stock' }));
      const alerts = [...lowRaw, ...lowProd];

      if (alerts.length === 0) {
        alertTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #10B981; padding: 12px;">✅ Stock en niveles óptimos. Sin alertas pendientes.</td></tr>`;
      } else {
        alertTbody.innerHTML = alerts.slice(0, 5).map(a => `
          <tr>
            <td><strong>${a.name}</strong></td>
            <td><small>${a.type}</small></td>
            <td style="font-weight: 700; color: #EF4444;">${a.stock}</td>
            <td><span class="badge" style="background: #EF4444; color: white;">${a.status}</span></td>
          </tr>
        `).join('');
      }
    }
  }

  // Listener para botones de Acciones Rápidas
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTabId = e.target.closest('button').getAttribute('data-target');
      if (!targetTabId) return;

      const navBtn = document.querySelector(`.nav-item[data-tab="${targetTabId}"]`);
      if (navBtn) navBtn.click();
    });
  });

  // Modal Metas Dashboard
  const modalGoals = document.getElementById('modal-edit-dashboard-goals');
  const btnOpenGoals = document.getElementById('btn-open-dashboard-goals-modal');
  const btnCloseGoals = document.getElementById('btn-close-goals-modal');
  const btnCancelGoals = document.getElementById('btn-cancel-goals-modal');
  const formGoals = document.getElementById('form-edit-dashboard-goals');

  if (btnOpenGoals && modalGoals) btnOpenGoals.addEventListener('click', () => modalGoals.classList.add('active'));
  if (btnCloseGoals && modalGoals) btnCloseGoals.addEventListener('click', () => modalGoals.classList.remove('active'));
  if (btnCancelGoals && modalGoals) btnCancelGoals.addEventListener('click', () => modalGoals.classList.remove('active'));

  if (formGoals) {
    formGoals.addEventListener('submit', (e) => {
      e.preventDefault();
      dashboardGoals.salesGoal = parseFloat(document.getElementById('goal-sales-input')?.value || '1200000');
      dashboardGoals.ticketGoal = parseFloat(document.getElementById('goal-ticket-input')?.value || '15000');

      loadDashboardData();
      modalGoals.classList.remove('active');
      alert('✅ Metas y objetivos del Dashboard actualizados con éxito.');
    });
  }

  // -----------------------------------------------------------------------------
  // ESTRUCTURA DE PRECIOS & CALCULADORA DINÁMICA DE COSTOS Y MÁRGENES (LISTA + FICHA)
  // -----------------------------------------------------------------------------
  let activeProductForPricing = null;

  function loadPricingMatrix() {
    renderPricingProductsList(finalProducts);
  }

  function renderPricingProductsList(list) {
    const tbody = document.getElementById('pricing-products-table-body');
    const countElem = document.getElementById('pricing-total-count');

    if (countElem) countElem.innerText = `${list.length} Productos`;
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No se encontraron productos coincidentes.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => {
      const rawCost = Math.round(p.salePrice * 0.4);
      const pkgCost = 180;
      const laborCost = 100;
      const fixedCost = 200;
      const baseCost = Math.round(rawCost + pkgCost + laborCost + fixedCost);

      const priceMostrador = Math.round(p.salePrice);
      const profitNet = Math.max(0, priceMostrador - baseCost);
      const marginPct = Math.round((profitNet / priceMostrador) * 100);

      return `
        <tr>
          <td><strong style="color: var(--primary-sage); font-family: monospace; font-size: 13px;">${p.code}</strong></td>
          <td><strong style="font-size: 14px;">${p.name}</strong></td>
          <td><span class="badge" style="background: var(--bg-linen); color: var(--text-dark);">${p.netWeightLabel}</span></td>
          <td><small style="color: var(--text-muted);">Insumo Granel</small></td>
          <td style="font-weight: 800; font-size: 16px; color: var(--terracotta);">$${priceMostrador.toLocaleString()}</td>
          <td><span class="badge" style="background: var(--primary-sage); color: white;">Margen ${marginPct}%</span></td>
          <td style="text-align: center;">
            <button class="btn btn-secondary btn-sm btn-edit-pricing" data-id="${p.id}" title="Editar Ficha Financiera">
              <i data-lucide="edit-3"></i> Editar Ficha
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Listener para abrir la Ficha Financiera
    document.querySelectorAll('.btn-edit-pricing').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').getAttribute('data-id');
        const prod = finalProducts.find(p => p.id === id);
        if (prod) openProductPricingModal(prod);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Buscador de Estructura de Precios
  const filterPricingSearch = document.getElementById('filter-pricing-search');
  if (filterPricingSearch) {
    filterPricingSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = finalProducts.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
      renderPricingProductsList(filtered);
    });
  }

  // Ficha Financiera Modal Handlers
  const modalPricing = document.getElementById('modal-edit-product-pricing');
  const btnClosePricing = document.getElementById('btn-close-pricing-modal');
  const btnCancelPricing = document.getElementById('btn-cancel-pricing-modal');
  const formPricing = document.getElementById('form-edit-product-pricing');

  function openProductPricingModal(prod) {
    activeProductForPricing = prod;
    if (!modalPricing) return;

    document.getElementById('pricing-modal-title').innerText = `Estructura de Costos: ${prod.name}`;
    document.getElementById('pricing-modal-subtitle').innerText = `SKU: ${prod.code} | Peso Neto: ${prod.netWeightLabel}`;

    const rawSelect = document.getElementById('edit-price-raw-id');
    if (rawSelect) {
      rawSelect.innerHTML = rawMaterials.map(m => `
        <option value="${m.id}">${m.name} ($${(m.costPerUnit || 0).toLocaleString()}/${m.unit})</option>
      `).join('');
    }

    document.getElementById('edit-price-raw-qty').value = '0.250';
    document.getElementById('edit-price-pkg-cost').value = '150.00';
    document.getElementById('edit-price-label-cost').value = '30.00';
    document.getElementById('edit-price-labor-cost').value = '100.00';
    document.getElementById('edit-price-fixed-cost').value = '200.00';
    document.getElementById('edit-price-tax-pct').value = '21.0';

    document.getElementById('edit-price-margin-local').value = '40.0';
    document.getElementById('edit-price-margin-wa').value = '45.0';
    document.getElementById('edit-price-margin-web').value = '55.0';

    recalculatePricingModalFields();
    modalPricing.classList.add('active');
  }

  function recalculatePricingModalFields() {
    if (!activeProductForPricing) return;

    const rawId = document.getElementById('edit-price-raw-id')?.value;
    const rawMat = rawMaterials.find(m => m.id === rawId) || rawMaterials[0];

    const rawQty = parseFloat(document.getElementById('edit-price-raw-qty')?.value || '0');
    const rawCostPerUnit = rawMat ? (rawMat.costPerUnit || 3400) : 3400;
    const calculatedRawCost = Math.round(rawQty * rawCostPerUnit);

    const pkgCost = parseFloat(document.getElementById('edit-price-pkg-cost')?.value || '0');
    const labelCost = parseFloat(document.getElementById('edit-price-label-cost')?.value || '0');
    const laborCost = parseFloat(document.getElementById('edit-price-labor-cost')?.value || '0');
    const fixedCost = parseFloat(document.getElementById('edit-price-fixed-cost')?.value || '0');
    const taxPct = parseFloat(document.getElementById('edit-price-tax-pct')?.value || '21');

    const directCosts = calculatedRawCost + pkgCost + labelCost + laborCost + fixedCost;
    const baseTotalCost = Math.round(directCosts * (1 + (taxPct / 100)));

    const marginLocal = parseFloat(document.getElementById('edit-price-margin-local')?.value || '40');
    const marginWa = parseFloat(document.getElementById('edit-price-margin-wa')?.value || '45');
    const marginWeb = parseFloat(document.getElementById('edit-price-margin-web')?.value || '55');

    const priceLocal = Math.round(baseTotalCost * (1 + (marginLocal / 100)));
    const priceWa = Math.round(baseTotalCost * (1 + (marginWa / 100)));
    const priceWeb = Math.round(baseTotalCost * (1 + (marginWeb / 100)));

    const rawCostElem = document.getElementById('edit-price-raw-calculated-cost');
    if (rawCostElem) rawCostElem.innerText = `$${calculatedRawCost.toLocaleString()}`;

    const baseCostElem = document.getElementById('edit-price-total-base-cost');
    if (baseCostElem) baseCostElem.innerText = `$${baseTotalCost.toLocaleString()}`;

    document.getElementById('edit-price-out-local').value = priceLocal;
    document.getElementById('edit-price-out-wa').value = priceWa;
    document.getElementById('edit-price-out-web').value = priceWeb;

    // Actualizar Barra Proporcional
    const totalOut = priceLocal || 1;
    const pctRaw = Math.round((calculatedRawCost / totalOut) * 100);
    const pctPkg = Math.round(((pkgCost + labelCost) / totalOut) * 100);
    const pctLabor = Math.round(((laborCost + fixedCost) / totalOut) * 100);
    const pctProfit = Math.max(0, 100 - (pctRaw + pctPkg + pctLabor));

    const bRaw = document.getElementById('bar-cost-raw');
    const bPkg = document.getElementById('bar-cost-pkg');
    const bLabor = document.getElementById('bar-cost-labor');
    const bProfit = document.getElementById('bar-cost-profit');

    if (bRaw) bRaw.style.width = `${pctRaw}%`;
    if (bPkg) bPkg.style.width = `${pctPkg}%`;
    if (bLabor) bLabor.style.width = `${pctLabor}%`;
    if (bProfit) bProfit.style.width = `${pctProfit}%`;
  }

  // Recalcular al editar campos de la Ficha
  ['edit-price-raw-id', 'edit-price-raw-qty', 'edit-price-pkg-cost', 'edit-price-label-cost', 'edit-price-labor-cost', 'edit-price-fixed-cost', 'edit-price-tax-pct', 'edit-price-margin-local', 'edit-price-margin-wa', 'edit-price-margin-web'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.addEventListener('input', recalculatePricingModalFields);
  });

  if (btnClosePricing) btnClosePricing.addEventListener('click', () => modalPricing.classList.remove('active'));
  if (btnCancelPricing) btnCancelPricing.addEventListener('click', () => modalPricing.classList.remove('active'));

  if (formPricing) {
    formPricing.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeProductForPricing) return;

      const newLocalPrice = parseFloat(document.getElementById('edit-price-out-local')?.value || '0');
      activeProductForPricing.salePrice = newLocalPrice;

      renderFinalProductsTable(finalProducts);
      renderPricingProductsList(finalProducts);
      populateSalesProductSelects();
      modalPricing.classList.remove('active');

      alert(`✅ Ficha financiera de "${activeProductForPricing.name}" actualizada con éxito. Precio Mostrador fijado en $${newLocalPrice.toLocaleString()}.`);
    });
  }

  // -----------------------------------------------------------------------------
  // MÓDULO DE CONFIGURACIÓN DEL SISTEMA Y PESTAÑAS SUB-VIEW
  // -----------------------------------------------------------------------------
  const btnSubDiet = document.getElementById('btn-settings-subtab-diet');
  const btnSubBiz = document.getElementById('btn-settings-subtab-business');
  const btnSubPrint = document.getElementById('btn-settings-subtab-print');
  const btnSubComm = document.getElementById('btn-settings-subtab-commissions');
  const btnSubUsers = document.getElementById('btn-settings-subtab-users');

  const viewSubDiet = document.getElementById('settings-view-diet');
  const viewSubBiz = document.getElementById('settings-view-business');
  const viewSubPrint = document.getElementById('settings-view-print');
  const viewSubComm = document.getElementById('settings-view-commissions');
  const viewSubUsers = document.getElementById('settings-view-users');

  function switchSettingsSubtab(activeBtn, activeView) {
    [btnSubDiet, btnSubBiz, btnSubPrint, btnSubComm, btnSubUsers].forEach(b => {
      if (b) b.className = 'btn btn-secondary';
    });
    [viewSubDiet, viewSubBiz, viewSubPrint, viewSubComm, viewSubUsers].forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (activeBtn) activeBtn.className = 'btn btn-primary active';
    if (activeView) activeView.style.display = 'block';

    if (activeView === viewSubUsers) renderSystemUsersList();
  }

  if (btnSubDiet) btnSubDiet.addEventListener('click', () => switchSettingsSubtab(btnSubDiet, viewSubDiet));
  if (btnSubBiz) btnSubBiz.addEventListener('click', () => switchSettingsSubtab(btnSubBiz, viewSubBiz));
  if (btnSubPrint) btnSubPrint.addEventListener('click', () => switchSettingsSubtab(btnSubPrint, viewSubPrint));
  if (btnSubComm) btnSubComm.addEventListener('click', () => switchSettingsSubtab(btnSubComm, viewSubComm));
  if (btnSubUsers) btnSubUsers.addEventListener('click', () => switchSettingsSubtab(btnSubUsers, viewSubUsers));

  // Formularíos de Configuración
  const formCreateDiet = document.getElementById('form-create-diet');
  if (formCreateDiet) {
    formCreateDiet.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('diet-name')?.value.trim();
      const code = document.getElementById('diet-code')?.value.trim().toUpperCase();
      const color = document.getElementById('diet-color')?.value || '#5E7055';
      const desc = document.getElementById('diet-desc')?.value.trim() || '';

      const newDiet = { id: `d-${Date.now()}`, code, name, badgeColorHex: color, description: desc };
      activeDietaryProfiles.push(newDiet);

      renderDietCardsList();
      formCreateDiet.reset();
      alert(`✅ Nueva preferencia dietética "${name}" guardada exitosamente.`);
    });
  }

  function renderDietCardsList() {
    const listContainer = document.getElementById('diet-cards-list');
    if (!listContainer) return;
    listContainer.innerHTML = activeDietaryProfiles.map(d => `
      <div class="diet-card-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--card-border); border-radius: 8px; margin-bottom: 8px; background: white;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${d.badgeColorHex};"></span>
          <div>
            <strong>${d.name}</strong> <small style="color: var(--text-muted);">(${d.code})</small>
            <div style="font-size: 11px; color: var(--text-muted);">${d.description || 'Sin observaciones'}</div>
          </div>
        </div>
        <span class="badge" style="background: ${d.badgeColorHex}; color: white;">Activo</span>
      </div>
    `).join('');
  }
  renderDietCardsList();

  // Gestor de Carga del Logo Comercial
  const btnUploadLogoFile = document.getElementById('btn-upload-logo-file');
  const inputLogoFile = document.getElementById('setting-biz-logo-file');
  const inputLogoUrl = document.getElementById('setting-biz-logo-url');
  const logoPreviewElem = document.getElementById('setting-logo-preview');

  if (btnUploadLogoFile && inputLogoFile) {
    btnUploadLogoFile.addEventListener('click', () => inputLogoFile.click());
  }

  if (inputLogoFile) {
    inputLogoFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const logoDataUrl = event.target.result;
          updateSystemLogo(logoDataUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (inputLogoUrl) {
    inputLogoUrl.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) updateSystemLogo(url);
    });
  }

  function updateSystemLogo(logoUrl) {
    const brandLogoElem = document.querySelector('.brand-logo');
    if (brandLogoElem) {
      brandLogoElem.innerHTML = `<img src="${logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    if (logoPreviewElem) {
      logoPreviewElem.innerHTML = `Estado Logo: <strong style="color: var(--primary-sage);">Cargado correctamente</strong> <img src="${logoUrl}" style="height: 24px; vertical-align: middle; border-radius: 4px; margin-left: 6px;">`;
    }
  }

  const formBiz = document.getElementById('form-settings-business');
  if (formBiz) {
    formBiz.addEventListener('submit', (e) => {
      e.preventDefault();
      const urlVal = inputLogoUrl?.value.trim();
      if (urlVal) updateSystemLogo(urlVal);
      alert('✅ Datos Comerciales & Logo Comercial guardados exitosamente.');
    });
  }

  const formPrint = document.getElementById('form-settings-print');
  if (formPrint) {
    formPrint.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('✅ Parámetros de Impresión Térmica (NIIMBOT B1 Pro / TSPL) actualizados correctamente.');
    });
  }

  const formComm = document.getElementById('form-settings-commissions');
  if (formComm) {
    formComm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('✅ Esquema de comisiones por canal guardado.');
    });
  }

  // Botón Rápido de Configuración de Usuarios desde el Top Header Bar
  const btnQuickUsers = document.getElementById('btn-quick-users-settings');
  if (btnQuickUsers) {
    btnQuickUsers.addEventListener('click', () => {
      const settingsTabBtn = document.querySelector('.nav-item[data-tab="tab-settings"]');
      if (settingsTabBtn) settingsTabBtn.click();

      const subtabUsersBtn = document.getElementById('btn-settings-subtab-users');
      if (subtabUsersBtn) subtabUsersBtn.click();
    });
  }

  function updateUserRoleSelectDropdown() {
    const selectElem = document.getElementById('user-role-select');
    if (!selectElem) return;

    selectElem.innerHTML = systemUsers.map(u => `
      <option value="${u.id}" ${u.id === activeUserSession.id ? 'selected' : ''}>
        ${u.role === 'ADMIN' ? '👑' : (u.role === 'CASHIER' ? '🛒' : '📦')} ${u.name} (${u.title})
      </option>
    `).join('');
  }

  function renderSystemUsersList() {
    const container = document.getElementById('system-users-cards-list');
    if (!container) return;

    container.innerHTML = systemUsers.map(u => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--bg-linen); border-radius: 12px; border: 1px solid var(--card-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="user-avatar-circle" style="width: 40px; height: 40px; font-size: 14px;">${u.avatar}</div>
          <div>
            <strong style="font-size: 15px; color: var(--text-dark);">${u.name}</strong>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${u.title} | PIN: <strong style="letter-spacing: 2px; color: var(--primary-sage);" id="pin-mask-${u.id}">••••</strong>
              <button type="button" class="btn-toggle-pin-view" data-id="${u.id}" data-pin="${u.pin}" style="background: transparent; border: none; cursor: pointer; margin-left: 6px; font-size: 12px;" title="Ver PIN">👁️</button>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge" style="background: var(--primary-light); color: var(--primary-light-text); font-weight: 700;">${u.role}</span>
          <button type="button" class="btn btn-secondary btn-sm btn-edit-user" data-id="${u.id}" style="padding: 4px 10px; font-size: 12px;">✏️ Editar</button>
          <button type="button" class="btn btn-secondary btn-sm btn-delete-user" data-id="${u.id}" style="padding: 4px 10px; font-size: 12px; color: var(--terracotta);" ${u.role === 'ADMIN' ? 'disabled' : ''}>🗑️</button>
        </div>
      </div>
    `).join('');

    // Toggle PIN Visibility
    container.querySelectorAll('.btn-toggle-pin-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.target.getAttribute('data-id');
        const pin = e.target.getAttribute('data-pin');
        const maskElem = document.getElementById(`pin-mask-${uid}`);
        if (maskElem) {
          if (maskElem.innerText === '••••') {
            maskElem.innerText = pin;
            e.target.innerText = '🙈';
          } else {
            maskElem.innerText = '••••';
            e.target.innerText = '👁️';
          }
        }
      });
    });

    // Edit User (Poblar campos y checkboxes de permisos)
    container.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.target.getAttribute('data-id');
        const u = systemUsers.find(x => x.id === uid);
        if (u) {
          document.getElementById('user-full-name').value = u.name;
          document.getElementById('user-role-assign').value = u.role;
          document.getElementById('user-pin-input').value = u.pin;
          document.getElementById('user-avatar-initials').value = u.avatar;

          // Marcar los checkboxes de permisos específicos del usuario
          const allowed = u.customAllowedTabs || rolePermissions[u.role]?.allowedTabs || [];
          document.querySelectorAll('.user-perm-cb').forEach(cb => {
            cb.checked = allowed.includes(cb.value);
          });

          document.getElementById('user-full-name').focus();
        }
      });
    });

    // Delete User
    container.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.target.getAttribute('data-id');
        const u = systemUsers.find(x => x.id === uid);
        if (u && confirm(`¿Estás seguro de eliminar el usuario "${u.name}"?`)) {
          systemUsers = systemUsers.filter(x => x.id !== uid);
          updateUserRoleSelectDropdown();
          renderSystemUsersList();
        }
      });
    });
  }

  // Cambio de Rol en Formulario actualiza checkboxes por defecto
  const userRoleAssignSelect = document.getElementById('user-role-assign');
  if (userRoleAssignSelect) {
    userRoleAssignSelect.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      const defaults = rolePermissions[selectedRole]?.allowedTabs || [];
      document.querySelectorAll('.user-perm-cb').forEach(cb => {
        cb.checked = defaults.includes(cb.value);
      });
    });
  }

  const formCreateUser = document.getElementById('form-create-system-user');
  if (formCreateUser) {
    formCreateUser.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('user-full-name')?.value.trim();
      const role = document.getElementById('user-role-assign')?.value || 'CASHIER';
      const pin = document.getElementById('user-pin-input')?.value.trim();
      const initials = document.getElementById('user-avatar-initials')?.value.trim().toUpperCase() || 'U';

      // Capturar checkboxes de permisos seleccionados
      const selectedTabs = Array.from(document.querySelectorAll('.user-perm-cb:checked')).map(cb => cb.value);

      const existingIdx = systemUsers.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        systemUsers[existingIdx].role = role;
        systemUsers[existingIdx].pin = pin;
        systemUsers[existingIdx].avatar = initials;
        systemUsers[existingIdx].customAllowedTabs = selectedTabs;
      } else {
        systemUsers.push({
          id: `u-${Date.now()}`,
          name,
          role,
          pin,
          avatar: initials,
          title: role === 'ADMIN' ? 'Dueño / Admin' : (role === 'CASHIER' ? 'Cajero / Ventas' : 'Operario Depósito'),
          customAllowedTabs: selectedTabs
        });
      }

      // Si el usuario editado es la sesión activa actual, re-aplicar permisos inmediatamente
      if (activeUserSession.name.toLowerCase() === name.toLowerCase()) {
        activeUserSession.customAllowedTabs = selectedTabs;
        applyRolePermissions(activeUserSession.role);
      }

      updateUserRoleSelectDropdown();
      renderSystemUsersList();
      renderLoginUserCards();
      formCreateUser.reset();
      alert(`✅ Permisos y datos de usuario "${name}" guardados exitosamente (${selectedTabs.length} módulos permitidos).`);
    });
  }

  // -----------------------------------------------------------------------------
  // PANTALLA DE BIENVENIDA / SELECCIÓN DE USUARIO ESTILO POS / NETFLIX
  // -----------------------------------------------------------------------------
  const loginOverlay = document.getElementById('login-profile-overlay');
  const loginCardsContainer = document.getElementById('login-user-cards-grid');
  const loginPinContainer = document.getElementById('login-pin-container');
  let loginSelectedUser = null;
  let loginTypedPin = '';

  window.selectLoginUser = function(uid) {
    loginSelectedUser = systemUsers.find(x => x.id === uid) || systemUsers[0];

    document.querySelectorAll('.login-user-card').forEach(c => {
      if (c.getAttribute('data-id') === uid) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });

    const pinCont = document.getElementById('login-pin-container');
    if (pinCont) {
      pinCont.style.display = 'block';
      const nameElem = document.getElementById('login-selected-user-name');
      const roleElem = document.getElementById('login-selected-user-role');
      if (nameElem) nameElem.innerText = loginSelectedUser.name;
      if (roleElem) roleElem.innerText = `${loginSelectedUser.title} | Ingresa tu PIN de 4 dígitos`;
    }

    loginTypedPin = '';
    updateLoginPinDots();
  };

  function renderLoginUserCards() {
    if (!loginCardsContainer) return;

    loginCardsContainer.innerHTML = systemUsers.map(u => `
      <div class="login-user-card ${loginSelectedUser && loginSelectedUser.id === u.id ? 'selected' : ''}" data-id="${u.id}" onclick="selectLoginUser('${u.id}')">
        <div class="login-user-avatar">${u.avatar}</div>
        <div class="login-user-name">${u.name}</div>
        <div class="login-user-role-badge">${u.role === 'ADMIN' ? '👑 Admin' : (u.role === 'CASHIER' ? '🛒 Cajero' : '📦 Operario')}</div>
      </div>
    `).join('');
  }

  window.updateLoginPinDots = function() {
    const dotsContainer = document.getElementById('login-pin-display-dots');
    if (!dotsContainer) return;
    const len = (window.loginTypedPin || '').length;
    let dotsHtml = '';
    for (let i = 0; i < 4; i++) {
      dotsHtml += i < len ? `<span class="pin-dot" style="color: var(--primary-sage);">●</span>` : `<span class="pin-dot" style="color: #CBD5E1;">○</span>`;
    }
    dotsContainer.innerHTML = dotsHtml;
  };

  document.querySelectorAll('.login-numpad-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.target.getAttribute('data-val');
      if ((window.loginTypedPin || '').length < 6) {
        window.loginTypedPin = (window.loginTypedPin || '') + val;
        window.updateLoginPinDots();
        if (window.loginTypedPin.length === 4 && window.loginSelectedUser) {
          verifyLoginPin();
        }
      }
    });
  });

  const btnLoginClear = document.getElementById('btn-login-numpad-clear');
  if (btnLoginClear) {
    btnLoginClear.addEventListener('click', () => {
      window.loginTypedPin = (window.loginTypedPin || '').slice(0, -1);
      window.updateLoginPinDots();
    });
  }

  const btnLoginOk = document.getElementById('btn-login-numpad-ok');
  if (btnLoginOk) {
    btnLoginOk.addEventListener('click', () => verifyLoginPin());
  }

  function verifyLoginPin() {
    const targetUser = window.loginSelectedUser;
    if (!targetUser) return;

    if (window.loginTypedPin === targetUser.pin) {
      activeUserSession = targetUser;
      if (userRoleSelect) userRoleSelect.value = activeUserSession.id;
      applyRolePermissions(activeUserSession.role);

      const avatarCircle = document.querySelector('.user-avatar-circle');
      const profileBadgeSpan = document.querySelector('.user-profile-badge span');
      if (avatarCircle) avatarCircle.innerText = activeUserSession.avatar;
      if (profileBadgeSpan) profileBadgeSpan.innerText = activeUserSession.name;

      if (loginOverlay) loginOverlay.classList.remove('active');
    } else {
      alert(`❌ PIN de seguridad incorrecto para ${targetUser.name}. Intenta nuevamente.`);
      window.loginTypedPin = '';
      window.updateLoginPinDots();
    }
  }

  const btnLockSwitchUser = document.getElementById('btn-lock-switch-user');
  const userProfileBadge = document.querySelector('.user-profile-badge');

  function triggerUserSwitchLockScreen() {
    loginSelectedUser = null;
    loginTypedPin = '';
    if (loginPinContainer) loginPinContainer.style.display = 'none';
    renderLoginUserCards();
    if (loginOverlay) loginOverlay.classList.add('active');
  }

  if (btnLockSwitchUser) btnLockSwitchUser.addEventListener('click', triggerUserSwitchLockScreen);
  if (userProfileBadge) {
    userProfileBadge.style.cursor = 'pointer';
    userProfileBadge.title = 'Hacé clic para cambiar de usuario / Bloquear pantalla';
    userProfileBadge.addEventListener('click', triggerUserSwitchLockScreen);
  }

  // -----------------------------------------------------------------------------
  // CARGA INICIAL AUTOMÁTICA DE TODAS LAS VISTAS
  // -----------------------------------------------------------------------------
  loadDashboardData();
  renderMasterCustomersTable(currentCustomers);
  loadSuppliersData();
  loadInventoryData();
  renderTaskKanbanBoard(mockTasksBoard);
  renderSystemUsersList();
  updateUserRoleSelectDropdown();
  renderLoginUserCards();
  renderSalesKanbanBoard(mockSalesBoard);
  loadSalesFormData();
  loadExpensesData();
  loadPricingMatrix();
  loadGoodsReceiptData();
  loadMarketingData();
  loadFinanceCustomers();
  loadFinanceSuppliers();
});
