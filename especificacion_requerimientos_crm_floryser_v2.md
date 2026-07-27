# Especificación Funcional y Requerimientos del Sistema Integral (CRM + ERP)
## Proyecto: "Flor y Ser Almacén Natural" (Versión 2.0)

**Documento de Alcance y Diseño Funcional para Desarrollo Software a Medida**

---

### 1. Ficha Técnica del Proyecto

| Parámetro | Detalle Especificado |
| :--- | :--- |
| **Tipo de Desarrollo** | Software a medida 100% personalizado |
| **Usuarios Directos** | Dueñas del emprendimiento y personal operativo |
| **Dispositivos de Acceso** | PC de escritorio (mostrador), Laptops, Tablets y Teléfonos Móviles |
| **Canales de Venta** | Local físico / Mostrador, WhatsApp, Tienda Online e Instagram |
| **Plataforma Base** | Sistema Cloud / Web Responsive accesible multidispositivo en tiempo real |

---

### 2. Módulo de Gestión de Clientes (CRM) y Fidelización

El módulo CRM centraliza toda la información comercial y relacional del cliente para potenciar las ventas recurrentes y brindar una atención personalizada.

#### 2.1. Ficha Unificada del Cliente
- **Datos Obligatorios:** Nombre y Apellido, Teléfono / WhatsApp, Correo Electrónico, Dirección de Entrega y Fecha de Cumpleaños.
- **Perfil Dietético y Preferencias del Almacén:** Vegano, Celíaco / Sin TACC, Orgánico, Diabético, Intolerancias o Alergias Alimentarias específicas y preferencias de consumo habitual.
- **Segmentación Multidimensional:**
  - *Por Frecuencia y Volumen:* Cliente Ocasional, Frecuente, VIP y Mayorista / Revendedor.
  - *Por Canal Preferido:* Venta en Mostrador vs. Delivery / Envíos a Domicilio.
- **Historial Integrado:** Registro completo de compras pasadas, pedidos realizados, presupuestos emitidos, consultas registradas y notas de preferencias o reclamos.

#### 2.2. Programa de Puntos y Fidelización
- **Acumulación Automática:** Asignación de puntos en función del monto total de cada compra realizada por cualquier canal.
- **Redención:** Canje transparente de puntos por descuentos en futuras compras o productos seleccionados del almacén.

#### 2.3. Automatizaciones de Marketing y Comunicación
- **Mensaje de Bienvenida:** Envío automático tras el alta del cliente con presentación del almacén y código de descuento inicial.
- **Recordatorio de Reposición Automatizado:** Detección de hábitos de compra para sugerir recompra periódica de insumos habituales (ej. frutos secos, harinas, leches vegetales).
- **Beneficios por Cumpleaños:** Saludo automatizado y cupón promocional en la fecha registrada.
- **Novedades e Ingresos Frescos:** Difusión segmentada según perfil dietético ante el ingreso de productos frescos (verduras orgánicas, panificados sin TACC, etc.).
- **Canales de Salida:** Integración directa con WhatsApp Business API y Email Marketing.

---

### 3. Ventas, Cobros, Cuentas Corrientes de Clientes y Presupuestos

#### 3.1. Flujo Operativo de Pedidos y Delivery
1. **Recepción del Pedido:** Ingreso por WhatsApp, Web o Mostrador.
2. **Verificación de Stock:** Sincronización automática con inventario de fraccionados y productos listos.
3. **Presupuestación / Cobro:** Registro del pago o imputación en cuenta corriente.
4. **Armado y Control:** Checklist de preparación en depósito / área de fraccionado.
5. **Despacho e Impresión:** Generación e impresión de etiqueta de envío y remito de entrega.

#### 3.2. Cuentas Corrientes de Clientes y Cobranzas
- **Modalidades de Cobro Soportadas:** Pago anticipado, pago contra entrega, efectivo, Mercado Pago y transferencias bancarias.
- **Gestión de Cuentas Corrientes:** Control de saldos adeudados por cliente, establecimiento de límites de crédito, registro de entregas a cuenta y emisión de extractos de cuenta en formato PDF para enviar por WhatsApp.
- **Módulo de Presupuestos:** Creación de presupuestos formales con vencimiento programado y conversión a pedido con un solo clic.

---

### 4. Proveedores, Compras y Cuentas por Pagar
- **Gestión de Ficha de Proveedores:** Registro de datos de contacto, condiciones comerciales, días de entrega y listas de precios asociadas.
- **Ingreso de Mercadería y Factura de Compra:** Módulo de recepción de insumos a granel y productos elaborados. Sincronización inmediata con el stock global.
- **Cuentas Corrientes con Proveedores:** Control detallado de facturas pendientes de pago, calendario de vencimientos, imputación de pagos/recibos y estado financiero con cada proveedor.

---

### 5. Inventario, Módulo de Fraccionado e Impresión de Etiquetas

#### 5.1. Control Integrado de Stock a Doble Nivel
- **Stock de Materia Prima / Granel:** Bolsas industriales, sacos, contenedores y materia prima para elaboración o fraccionado.
- **Stock de Productos Finales:** Unidades empaquetadas listos para la venta en mostrador o tienda online.

#### 5.2. Módulo Operativo de Fraccionado de Productos
- **Proceso de Fraccionado:** Transformación de lotes a granel en presentaciones fraccionadas (ej. 250 g, 500 g, 1 kg).
- **Descargo Automático de Stock:** La acción de fraccionar descuenta los kilogramos/litros correspondientes de materia prima y da de alta las unidades del producto final fraccionado.
- **Registro de Merma:** Opción para declarar porcentaje o peso de pérdida normal durante el empaque.

#### 5.3. Impresión de Etiquetas (Módulo Logístico y de Producto)
- **Etiquetas para Productos Fraccionados:** Impresión directa en impresoras térmicas con diseño personalizado que incluye:
  - Nombre del Producto y Marca.
  - Peso Neto / Contenido.
  - Fecha de Fraccionado y Fecha de Vencimiento.
  - Número de Lote.
  - Información Nutricional, Ingredientes y Sellos (Vegano, Sin TACC, Orgánico).
  - Código de Barras interno para lectura rápida en mostrador.
- **Etiquetas para Envíos y Logística:** Etiqueta adhesiva de paquete con Nombre del Cliente, Dirección de Entrega, WhatsApp de contacto, Zona/Barrio y Notas de Envío.

---

### 6. Reportes, Analítica y Métricas del Negocio (KPIs)

Tablero de control integral con gráficos y reportes exportables para la toma de decisiones:
- **Ticket Promedio:** Evolución por cliente, por canal de venta y por franja horaria.
- **Productos Estrella:** Ranking de productos más vendidos globalmente y segmentados por perfil dietético.
- **Retención y Tasa de Recompra:** Porcentaje de clientes recurrentes frente a nuevos compradores.
- **Listado de Clientes Inactivos:** Identificación automática de clientes sin compras en los últimos 30, 60 y 90 días para activar campañas de recuperación.
- **Rendimiento por Canal de Venta:** Comparativa de facturación entre Mostrador, WhatsApp y Tienda Web.
- **Análisis de Efectividad Comercial:** Determinación del canal con mayor margen y conversión.
- **Reportes Financieros y de Caja:** Arqueo de caja diario, resumen de cobros por medio de pago y balance global de Cuentas Corrientes.

---

### 7. Arquitectura Técnica e Integraciones

| Módulo / Componente | Especificación Técnica |
| :--- | :--- |
| **Arquitectura** | Aplicación Web Responsive en la Nube (SaaS) con base de datos unificada en tiempo real. |
| **Plataforma de Impresión** | Soporte para impresoras térmicas de etiquetas (Zebra, Hasar, Xprinter) y rotuladoras POS de tickets. |
| **Integración WhatsApp** | Conexión mediante API para envío automatizado de notificaciones, mensajes de bienvenida y recordatorios. |
| **E-Commerce & Pagos** | Sincronización bidireccional de stock y ventas con Tienda Online y pasarelas de pago (Mercado Pago, Webhooks bancarios). |
