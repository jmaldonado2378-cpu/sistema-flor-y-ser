-- =============================================================================
-- ESQUEMA DE BASE DE DATOS - FLOR Y SER ALMACÉN NATURAL (VERSIÓN 2.0)
-- Motor: PostgreSQL 14+
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE point_transaction_type AS ENUM (
    'ACCUMULATION',
    'REDEMPTION',
    'ADJUSTMENT',
    'EXPIRATION'
);

CREATE TYPE acquisition_channel AS ENUM (
    'LOCAL',
    'WHATSAPP',
    'ONLINE_STORE',
    'INSTAGRAM'
);

CREATE TYPE printer_connection_type AS ENUM (
    'BLUETOOTH',
    'USB',
    'WEBSOCKET_LOCAL',
    'NETWORK'
);

CREATE TYPE printer_protocol AS ENUM (
    'NIIMBOT_PRO', -- Protocolo específico NIIMBOT (B1 Pro, B21, B3S)
    'TSPL',       -- Zebra / Xprinter / Gaincha
    'ESC_POS',    -- Impresoras térmicas de tickets/recibos
    'CPCL'        -- Impresoras portátiles Zebra
);

CREATE TYPE automation_type AS ENUM (
    'WELCOME',
    'REPLENISHMENT',
    'BIRTHDAY',
    'NEW_ARRIVALS'
);

CREATE TYPE automation_channel AS ENUM (
    'WHATSAPP',
    'EMAIL',
    'BOTH'
);

-- 1. Catálogo Dinámico de Perfiles Dietéticos (Modificable y Extensible)
CREATE TABLE dietary_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_color_hex VARCHAR(7) DEFAULT '#5E7055', -- Color visual personalizado
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,     -- Creado dinámicamente por el usuario
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Perfiles dietéticos iniciales
INSERT INTO dietary_profiles (code, name, description, badge_color_hex) VALUES
('VEGAN', 'Vegano', 'Sin ingredientes de origen animal', '#5E7055'),
('CELIAC', 'Sin TACC / Celíaco', 'Libre de trigo, avena, cebada y centeno', '#C87053'),
('ORGANIC', 'Orgánico / Agroecológico', 'Libre de agrotóxicos y fertilizantes sintéticos', '#8B9A46'),
('DIABETIC', 'Apto Diabéticos', 'Sin azúcares añadidos ni alto índice glucémico', '#6A5ACD'),
('NUT_ALLERGY', 'Alergia a Frutos Secos', 'Libre de frutos secos y maní', '#D97706'),
('KETO', 'Dieta Keto / Cetogénica', 'Bajo en carbohidratos, alto en grasas saludables', '#10B981'),
('FODMAP', 'Bajo en FODMAP', 'Apto para colon irritable y digestión sensible', '#0EA5E9');

-- 2. Clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_whatsapp VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    address TEXT,
    birth_date DATE,
    preferred_channel acquisition_channel NOT NULL DEFAULT 'LOCAL',
    points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Relación Clientes <-> Preferencias Dietéticas
CREATE TABLE customer_dietary_profiles (
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    dietary_profile_id UUID NOT NULL REFERENCES dietary_profiles(id) ON DELETE CASCADE,
    specific_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, dietary_profile_id)
);

-- 4. Historial de Fidelización y Puntos
CREATE TABLE customer_points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type point_transaction_type NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Registro de Automatizaciones y Notificaciones
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type automation_type NOT NULL,
    channel automation_channel NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED', 'SIMULATED'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Configuración de Impresoras Térmicas y Formato de Etiquetas
CREATE TABLE printer_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,              -- Ej: "NIIMBOT B1 Pro Local", "Etiquetadora Balanza"
    model VARCHAR(100) NOT NULL,             -- Ej: "NIIMBOT B1 Pro"
    connection_type printer_connection_type NOT NULL DEFAULT 'BLUETOOTH',
    protocol printer_protocol NOT NULL DEFAULT 'NIIMBOT_PRO',
    label_width_mm INT NOT NULL DEFAULT 50,  -- Ej: 50mm
    label_height_mm INT NOT NULL DEFAULT 30, -- Ej: 30mm
    dpi INT NOT NULL DEFAULT 203,            -- Resolución térmica (203 dpi estándar)
    mac_address_or_ip VARCHAR(100),          -- Dirección Bluetooth o IP
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registro por defecto de impresora NIIMBOT B1 Pro
INSERT INTO printer_configurations (name, model, connection_type, protocol, label_width_mm, label_height_mm, dpi, is_default) VALUES
('NIIMBOT B1 Pro (Mostrador)', 'NIIMBOT B1 Pro', 'BLUETOOTH', 'NIIMBOT_PRO', 50, 30, 203, TRUE);

-- Índices
CREATE INDEX idx_customers_phone ON customers(phone_whatsapp);
CREATE INDEX idx_customers_birth_date ON customers(EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date));
CREATE INDEX idx_dietary_active ON dietary_profiles(is_active);
CREATE INDEX idx_automation_customer ON automation_logs(customer_id);

-- Trigger de Timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_timestamp BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_update_dietary_timestamp BEFORE UPDATE ON dietary_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- MÓDULO 3: VENTAS, COBROS, CUENTAS CORRIENTES Y PRESUPUESTOS
-- =============================================================================

-- Enums
CREATE TYPE order_status AS ENUM (
    'PENDING',    -- Pendiente
    'PREPARING',  -- En preparación / Armado
    'READY',      -- Listo para entregar / retirar
    'DELIVERED',  -- Entregado / Completado
    'CANCELLED'   -- Cancelado
);

CREATE TYPE payment_status AS ENUM (
    'UNPAID',         -- No pagado
    'PARTIALLY_PAID', -- Parcialmente pagado
    'PAID'            -- Pagado completamente
);

CREATE TYPE payment_method_enum AS ENUM (
    'CASH',                   -- Efectivo
    'MERCADO_PAGO',           -- Mercado Pago (QR / Link / Alias)
    'TRANSFER',               -- Transferencia Bancaria
    'CURRENT_ACCOUNT_CREDIT'  -- Imputación a Cuenta Corriente
);

CREATE TYPE account_movement_type AS ENUM (
    'DEBIT',  -- Debe / Cargo (Incrementa deuda del cliente)
    'CREDIT'  -- Haber / Abono (Reduce deuda del cliente)
);

CREATE TYPE quote_status AS ENUM (
    'DRAFT',      -- Borrador
    'SENT',       -- Enviado
    'ACCEPTED',   -- Aceptado
    'CONVERTED',  -- Convertido a Pedido
    'EXPIRED',    -- Vencido
    'REJECTED'    -- Rechazado
);

-- Modificaciones en tabla customers para Cuentas Corrientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS current_account_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00;

-- 1. Presupuestos (Quotes / Budgets)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    channel acquisition_channel NOT NULL DEFAULT 'LOCAL',
    status quote_status NOT NULL DEFAULT 'DRAFT',
    expiration_date DATE NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    delivery_address TEXT,
    notes TEXT,
    converted_order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_id UUID,
    is_bulk_fractioned BOOLEAN NOT NULL DEFAULT FALSE,
    quantity NUMERIC(10,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    notes TEXT
);

-- 2. Ventas / Pedidos (Orders / Sales)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    channel acquisition_channel NOT NULL DEFAULT 'LOCAL',
    status order_status NOT NULL DEFAULT 'PENDING',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    points_earned INT NOT NULL DEFAULT 0,
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_id UUID,
    is_bulk_fractioned BOOLEAN NOT NULL DEFAULT FALSE,
    quantity NUMERIC(10,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    notes TEXT
);

ALTER TABLE quotes ADD CONSTRAINT fk_quotes_converted_order FOREIGN KEY (converted_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- 3. Cobros / Pagos (Payments / Collections)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payment_method payment_method_enum NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Movimientos de Cuenta Corriente (Customer Account Ledger)
CREATE TABLE customer_account_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    movement_type account_movement_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización Módulo 3
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_account_movements_customer ON customer_account_movements(customer_id, created_at DESC);

-- Triggers de actualización de timestamps para Presupuestos y Pedidos
CREATE TRIGGER trigger_update_quote_timestamp BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_update_order_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- MÓDULO 4: PROVEEDORES, RECEPCIÓN E INGRESO DE MERCADERÍA Y CUENTAS POR PAGAR
-- =============================================================================

CREATE TYPE merchandise_type AS ENUM (
    'GRANEL',   -- Materias primas / Insumos a granel (kg, g, l, ml)
    'ELABORADO' -- Productos finales elaborados o envasados (unidades)
);

CREATE TYPE supplier_payment_status AS ENUM (
    'PENDING',  -- Pendiente de pago
    'PARTIAL',  -- Parcialmente pagado
    'PAID',     -- Pagado completamente
    'OVERDUE'   -- Vencido
);

CREATE TYPE receipt_type AS ENUM (
    'FACTURA',       -- Factura de compra (A, B, C)
    'REMITO',        -- Remito de entrega del proveedor
    'NOTA_CREDITO'  -- Nota de crédito
);

CREATE TYPE supplier_payment_method AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'CHEQUE',
    'MERCADO_PAGO',
    'OTRO'
);

-- 1. Ficha de Proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_id VARCHAR(20) NOT NULL UNIQUE,          -- CUIT / RUT del proveedor
    business_name VARCHAR(255) NOT NULL,          -- Razón Social / Nombre Comercial
    contact_name VARCHAR(150),                    -- Nombre de contacto o vendedor
    phone VARCHAR(50) NOT NULL,                   -- Teléfono / WhatsApp
    email VARCHAR(150),
    address TEXT,
    categories TEXT[] DEFAULT '{}',               -- Rubros / Categorías provistas
    commercial_terms TEXT,                       -- Términos comerciales (ej: "30 días neto", "Contado")
    delivery_days VARCHAR(150),                  -- Días de visita o reparto
    bank_details TEXT,                            -- CBU, Alias, Banco
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Materias Primas e Insumos a Granel
CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',      -- KG, L, G, ML
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(12,3) NOT NULL DEFAULT 5.0,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- Costo por kg / litro
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    storage_location VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Productos e Insumos (Catálogo e Inventario Granel/Elaborado)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    product_type merchandise_type NOT NULL DEFAULT 'ELABORADO',
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'unidades', -- kg, g, l, ml, unidades
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3. Recepción e Ingreso de Mercadería (Facturas / Comprobantes de Compra)
CREATE TABLE merchandise_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(100) NOT NULL,       -- N° de comprobante / remito / factura
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    receipt_type receipt_type NOT NULL DEFAULT 'FACTURA',
    issue_date DATE NOT NULL,                   -- Fecha de emisión del comprobante
    reception_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha de recepción efectiva
    due_date DATE NOT NULL,                     -- Fecha de vencimiento para el pago
    payment_terms_days INT NOT NULL DEFAULT 0,  -- Días de crédito otorgados
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status supplier_payment_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Detalle de Items de Recepción
CREATE TABLE merchandise_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES merchandise_receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type merchandise_type NOT NULL DEFAULT 'ELABORADO',
    quantity NUMERIC(12,3) NOT NULL,            -- Cantidad ingresada
    unit_of_measure VARCHAR(20) NOT NULL,       -- kg, g, l, unidades
    unit_cost NUMERIC(12,2) NOT NULL,           -- Costo unitario
    subtotal NUMERIC(12,2) NOT NULL,            -- quantity * unit_cost
    lot_number VARCHAR(100),                    -- Número de lote
    expiration_date DATE,                       -- Fecha de vencimiento del lote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pagos a Proveedores / Cuentas por Pagar
CREATE TABLE accounts_payable_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES merchandise_receipts(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method supplier_payment_method NOT NULL DEFAULT 'TRANSFERENCIA',
    reference_number VARCHAR(100),              -- N° de transferencia, cheque o comprobante
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización Módulo 4
CREATE INDEX idx_suppliers_tax_id ON suppliers(tax_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_merchandise_receipts_supplier ON merchandise_receipts(supplier_id);
CREATE INDEX idx_merchandise_receipts_due_date ON merchandise_receipts(due_date);
CREATE INDEX idx_merchandise_receipts_status ON merchandise_receipts(payment_status);
CREATE INDEX idx_receipt_items_receipt ON merchandise_receipt_items(receipt_id);
CREATE INDEX idx_accounts_payable_receipt ON accounts_payable_payments(receipt_id);
CREATE INDEX idx_accounts_payable_supplier ON accounts_payable_payments(supplier_id);

-- Triggers de actualización de timestamps
CREATE TRIGGER trigger_update_supplier_timestamp BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_update_product_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_update_receipt_timestamp BEFORE UPDATE ON merchandise_receipts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- MÓDULO DE TAREAS OPERATIVAS Y TABLEROS KANBAN
-- =============================================================================

CREATE TABLE IF NOT EXISTS operational_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',             -- 'FRACTIONING', 'PACKAGING', 'CLEANING', 'GENERAL'
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING', -- 'PENDING_FRACTIONING', 'PACKAGING_IN_PROGRESS', 'QUALITY_CONTROL', 'COMPLETED'
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',           -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    assigned_to VARCHAR(150),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    quantity NUMERIC(12,3),
    unit_of_measure VARCHAR(50),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON operational_tasks(status);
CREATE INDEX idx_tasks_type ON operational_tasks(type);
CREATE INDEX idx_tasks_assigned_to ON operational_tasks(assigned_to);
CREATE INDEX idx_tasks_order_id ON operational_tasks(order_id);

CREATE TRIGGER trigger_update_task_timestamp BEFORE UPDATE ON operational_tasks FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- MÓDULO DE CLASIFICACIÓN DE ARTÍCULOS (FAMILIAS Y SUB-FAMILIAS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES article_families(id) ON DELETE SET NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    article_scope VARCHAR(50) NOT NULL DEFAULT 'ALL',
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES article_families(id);
ALTER TABLE final_products ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES article_families(id);
ALTER TABLE final_products ADD COLUMN IF NOT EXISTS is_blend BOOLEAN DEFAULT FALSE;
ALTER TABLE final_products ADD COLUMN IF NOT EXISTS ingredients_json JSONB;
ALTER TABLE packaging_materials ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES article_families(id);




