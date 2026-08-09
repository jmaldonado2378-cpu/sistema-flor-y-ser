-- =============================================================================
-- ESQUEMA DE BASE DE DATOS PARA HOSTINGER (MySQL / MariaDB / phpMyAdmin)
-- Sistema Flor y Ser Almacén Natural ERP/CRM v2.0
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Usuarios y PINs del Sistema
CREATE TABLE IF NOT EXISTS `system_users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `role` VARCHAR(30) NOT NULL DEFAULT 'CASHIER',
  `pin` VARCHAR(20) NOT NULL,
  `avatar` VARCHAR(10) NOT NULL DEFAULT 'US',
  `title` VARCHAR(100) NULL,
  `custom_allowed_tabs_json` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar Usuarios por Defecto
INSERT IGNORE INTO `system_users` (`id`, `name`, `role`, `pin`, `avatar`, `title`) VALUES
('u1', 'María Clara', 'ADMIN', '1234', 'MC', 'Dueño / Admin'),
('u2', 'Juan Pérez', 'CASHIER', '4321', 'JP', 'Cajero / Ventas'),
('u3', 'Carlos Ruiz', 'OPERATOR', '9999', 'CR', 'Operario Depósito');

-- 2. Tabla de Clientes (CRM)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `whatsapp` VARCHAR(30) NULL,
  `diet_profile` VARCHAR(100) NULL,
  `credit_limit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_debt` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `loyalty_points` INT NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Perfiles Dietéticos y Alérgenos
CREATE TABLE IF NOT EXISTS `dietary_profiles` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `badge_color_hex` VARCHAR(20) NOT NULL DEFAULT '#5E7055',
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Insumos a Granel / Materia Prima (Inventario Nivel 1)
CREATE TABLE IF NOT EXISTS `raw_materials` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `min_stock_alert` DECIMAL(12,3) NOT NULL DEFAULT 5.000,
  `cost_per_unit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_name` VARCHAR(150) NULL,
  `location_rack` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Productos Finales Empaquetados (Inventario Nivel 2)
CREATE TABLE IF NOT EXISTS `final_products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `raw_material_id` VARCHAR(64) NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `unit_weight` DECIMAL(12,3) NOT NULL DEFAULT 250.000,
  `net_content_label` VARCHAR(30) NOT NULL DEFAULT '250g',
  `current_stock` INT NOT NULL DEFAULT 0,
  `min_stock_alert` INT NOT NULL DEFAULT 10,
  `sale_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expiration_days` INT NOT NULL DEFAULT 180,
  `ingredients` TEXT NULL,
  `diets_json` TEXT NULL,
  `barcode` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Proveedores
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) NULL,
  `phone_whatsapp` VARCHAR(30) NULL,
  `email` VARCHAR(120) NULL,
  `address` VARCHAR(200) NULL,
  `tax_id` VARCHAR(30) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Cuentas Corrientes y Extractos
CREATE TABLE IF NOT EXISTS `checking_accounts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NULL,
  `supplier_id` VARCHAR(64) NULL,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `concept` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `type` ENUM('DEBIT', 'CREDIT') NOT NULL,
  `balance_after` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `invoice_number` VARCHAR(60) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Ventas y Pedidos
CREATE TABLE IF NOT EXISTS `sales` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NULL,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `channel` VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
  `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Ítems de Ventas
CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sale_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tareas Operativas & Kanban
CREATE TABLE IF NOT EXISTS `operational_tasks` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `task_type` VARCHAR(50) NOT NULL DEFAULT 'FRACTIONING',
  `priority` VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
  `stage` VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING',
  `assigned_operator` VARCHAR(100) NULL,
  `target_quantity` DECIMAL(12,2) NULL,
  `lot_number` VARCHAR(60) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Gastos Operativos del Almacén
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `voucher_number` VARCHAR(60) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Estructura de Precios & Costos por Canal
CREATE TABLE IF NOT EXISTS `pricing_structures` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `product_id` VARCHAR(64) NOT NULL UNIQUE,
  `raw_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `packaging_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `labor_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fixed_cost_share` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 21.00,
  `channel_margins_json` TEXT NULL,
  `calculated_prices_json` TEXT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Parámetros del Sistema & Datos del Almacén
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `business_name` VARCHAR(150) NOT NULL DEFAULT 'Flor y Ser Almacén Natural',
  `cuit` VARCHAR(30) NULL DEFAULT '30-71882910-4',
  `whatsapp` VARCHAR(30) NULL DEFAULT '+5491155439821',
  `address` VARCHAR(200) NULL DEFAULT 'Av. San Martín 1420, CABA',
  `logo_url` TEXT NULL,
  `print_settings_json` TEXT NULL,
  `commissions_json` TEXT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Familias y Sub-Familias de Artículos
CREATE TABLE IF NOT EXISTS `article_families` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `parent_id` VARCHAR(64) NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `article_scope` VARCHAR(30) NOT NULL DEFAULT 'ALL',
  `icon` VARCHAR(50) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `article_families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

