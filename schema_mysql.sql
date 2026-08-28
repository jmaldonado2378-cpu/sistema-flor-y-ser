-- =============================================================================
-- ESQUEMA DE BASE DE DATOS PARA HOSTINGER (MySQL / MariaDB / phpMyAdmin)
-- Sistema Flor y Ser Almacén Natural ERP/CRM v2.0
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas anteriores si existen para recrear esquema limpio v2.0
DROP TABLE IF EXISTS `commission_settlements`;
DROP TABLE IF EXISTS `seller_channel_commissions`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `quote_items`;
DROP TABLE IF EXISTS `quotes`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `customer_account_movements`;
DROP TABLE IF EXISTS `merchandise_receipt_items`;
DROP TABLE IF EXISTS `merchandise_receipts`;
DROP TABLE IF EXISTS `accounts_payable_payments`;
DROP TABLE IF EXISTS `fractioning_orders`;
DROP TABLE IF EXISTS `operational_tasks`;
DROP TABLE IF EXISTS `operational_expenses`;
DROP TABLE IF EXISTS `product_pricing_structures`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `marketing_campaigns`;
DROP TABLE IF EXISTS `marketing_templates`;
DROP TABLE IF EXISTS `automation_logs`;
DROP TABLE IF EXISTS `printer_configurations`;
DROP TABLE IF EXISTS `customer_dietary_profiles`;
DROP TABLE IF EXISTS `customer_points_history`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `dietary_profiles`;
DROP TABLE IF EXISTS `final_products`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `packaging_materials`;
DROP TABLE IF EXISTS `raw_materials`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `article_families`;
DROP TABLE IF EXISTS `system_users`;

-- 1. Tabla de Usuarios del Sistema (Autenticación JWT)
CREATE TABLE IF NOT EXISTS `system_users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'SELLER') NOT NULL DEFAULT 'SELLER',
  `allowed_modules_json` TEXT NULL,
  `avatar_initials` VARCHAR(10) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar Usuarios del Sistema
-- Admin: jmaldonado2378@gmail.com / admin123
-- Seller: memimaldonado05@gmail.com / LaJefa3012
INSERT INTO `system_users` (`id`, `name`, `email`, `password_hash`, `role`, `allowed_modules_json`, `avatar_initials`, `active`) VALUES
('usr-admin-1', 'Juan Pablo (Administrador)', 'jmaldonado2378@gmail.com', '$2b$10$bdWDJOTRlDF339VyM0fOgu7XSQMeKy2o2NOooR1BViXop1j0FzAyi', 'ADMIN', '["dashboard","customers","stock","article_families","merchandise_receipt","fractioning","new_sale","kanban_orders","kanban_tasks","suppliers","checking_accounts","finance","settings","marketing","users"]', 'JP', 1),
('usr-seller-1', 'Emilia Maldonado Hernandez', 'memimaldonado05@gmail.com', '$2b$10$EpkZkjN6zUxemeOwnKeO9enJx.aLGPKSrVz9aPh4WsZCzxJ1hPCqW', 'SELLER', '["dashboard","customers","stock","new_sale","kanban_orders","fractioning"]', 'EH', 1)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `allowed_modules_json` = VALUES(`allowed_modules_json`),
  `avatar_initials` = VALUES(`avatar_initials`),
  `active` = 1;

-- 2. Perfiles Dietéticos y Alérgenos (Catálogo Dinámico)
CREATE TABLE IF NOT EXISTS `dietary_profiles` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `badge_color_hex` VARCHAR(20) NOT NULL DEFAULT '#5E7055',
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `dietary_profiles` (`id`, `code`, `name`, `description`, `badge_color_hex`) VALUES
('dp-1', 'VEGAN', 'Vegano', 'Sin ingredientes de origen animal', '#5E7055'),
('dp-2', 'CELIAC', 'Sin TACC / Celíaco', 'Libre de trigo, avena, cebada y centeno', '#C87053'),
('dp-3', 'ORGANIC', 'Orgánico / Agroecológico', 'Libre de agrotóxicos y fertilizantes sintéticos', '#8B9A46'),
('dp-4', 'DIABETIC', 'Apto Diabéticos', 'Sin azúcares añadidos ni alto índice glucémico', '#6A5ACD'),
('dp-5', 'NUT_ALLERGY', 'Alergia a Frutos Secos', 'Libre de frutos secos y maní', '#D97706'),
('dp-6', 'KETO', 'Dieta Keto / Cetogénica', 'Bajo en carbohidratos, alto en grasas saludables', '#10B981'),
('dp-7', 'FODMAP', 'Bajo en FODMAP', 'Apto para colon irritable y digestión sensible', '#0EA5E9');

-- 3. Clientes (CRM)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone_whatsapp` VARCHAR(30) NOT NULL UNIQUE,
  `email` VARCHAR(150) NULL UNIQUE,
  `address` TEXT NULL,
  `birth_date` DATE NULL,
  `preferred_channel` ENUM('LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM') NOT NULL DEFAULT 'LOCAL',
  `points_balance` INT NOT NULL DEFAULT 0,
  `credit_limit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_account_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación Clientes <-> Perfiles Dietéticos
CREATE TABLE IF NOT EXISTS `customer_dietary_profiles` (
  `customer_id` VARCHAR(64) NOT NULL,
  `dietary_profile_id` VARCHAR(64) NOT NULL,
  `specific_notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`, `dietary_profile_id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dietary_profile_id`) REFERENCES `dietary_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de Puntos y Fidelización
CREATE TABLE IF NOT EXISTS `customer_points_history` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NOT NULL,
  `points` INT NOT NULL,
  `transaction_type` ENUM('ACCUMULATION', 'REDEMPTION', 'ADJUSTMENT', 'EXPIRATION') NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` VARCHAR(64) NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Familias y Clasificación de Artículos
CREATE TABLE IF NOT EXISTS `article_families` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `parent_id` VARCHAR(64) NULL,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `article_scope` VARCHAR(50) NOT NULL DEFAULT 'ALL',
  `icon` VARCHAR(100) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `article_families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Proveedores
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `tax_id` VARCHAR(20) NOT NULL UNIQUE,
  `business_name` VARCHAR(255) NOT NULL,
  `contact_name` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NULL,
  `address` TEXT NULL,
  `categories` TEXT NULL, -- JSON array en MySQL
  `commercial_terms` TEXT NULL,
  `delivery_days` VARCHAR(150) NULL,
  `bank_details` TEXT NULL,
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Insumos a Granel / Materias Primas
CREATE TABLE IF NOT EXISTS `raw_materials` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'KG',
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `min_stock` DECIMAL(12,3) NOT NULL DEFAULT 5.000,
  `cost_per_unit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_id` VARCHAR(64) NULL,
  `supplier_name` VARCHAR(255) NULL,
  `storage_location` VARCHAR(150) NULL,
  `family_id` VARCHAR(64) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`family_id`) REFERENCES `article_families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Materiales de Empaque
CREATE TABLE IF NOT EXISTS `packaging_materials` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'DOYPACK',
  `unit` VARCHAR(20) NOT NULL DEFAULT 'UN',
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `min_stock` DECIMAL(12,3) NOT NULL DEFAULT 10.000,
  `cost_per_unit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_name` VARCHAR(255) NULL,
  `storage_location` VARCHAR(255) NULL,
  `family_id` VARCHAR(64) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`family_id`) REFERENCES `article_families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Productos Finales (Elaborados / Fraccionados)
CREATE TABLE IF NOT EXISTS `final_products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `raw_material_id` VARCHAR(64) NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `barcode` VARCHAR(100) NULL,
  `name` VARCHAR(255) NOT NULL,
  `unit_weight_grams` DECIMAL(10,2) NULL,
  `net_content_label` VARCHAR(50) NULL,
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `min_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `ingredients` TEXT NULL,
  `dietary_badge_codes` JSON NULL,
  `default_expiration_days` INT NULL,
  `family_id` VARCHAR(64) NULL,
  `is_blend` TINYINT(1) NOT NULL DEFAULT 0,
  `ingredients_json` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`family_id`) REFERENCES `article_families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products alias / compatibilidad genérica
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `product_type` ENUM('GRANEL', 'ELABORADO') NOT NULL DEFAULT 'ELABORADO',
  `unit_of_measure` VARCHAR(20) NOT NULL DEFAULT 'unidades',
  `current_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `min_stock` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `sale_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier_id` VARCHAR(64) NULL,
  `category` VARCHAR(100) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Presupuestos (Quotes)
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `quote_number` VARCHAR(20) NOT NULL UNIQUE,
  `customer_id` VARCHAR(64) NOT NULL,
  `channel` ENUM('LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM') NOT NULL DEFAULT 'LOCAL',
  `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'EXPIRED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
  `expiration_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `delivery_address` TEXT NULL,
  `notes` TEXT NULL,
  `converted_order_id` VARCHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `quote_id` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `is_bulk_fractioned` TINYINT(1) NOT NULL DEFAULT 0,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `notes` TEXT NULL,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Ventas / Pedidos (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(20) NOT NULL UNIQUE,
  `customer_id` VARCHAR(64) NOT NULL,
  `seller_id` VARCHAR(64) NULL,
  `seller_name` VARCHAR(150) NULL,
  `quote_id` VARCHAR(64) NULL,
  `channel` ENUM('LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM') NOT NULL DEFAULT 'LOCAL',
  `status` ENUM('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `payment_status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `points_earned` INT NOT NULL DEFAULT 0,
  `commission_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `commission_settled` TINYINT(1) NOT NULL DEFAULT 0,
  `commission_settlement_id` VARCHAR(64) NULL,
  `delivery_address` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración de Comisiones por Vendedor y Canal
CREATE TABLE IF NOT EXISTS `seller_channel_commissions` (
  `user_id` VARCHAR(64) NOT NULL,
  `channel` ENUM('LOCAL', 'WHATSAPP', 'ONLINE_STORE', 'INSTAGRAM') NOT NULL,
  `commission_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro de Liquidaciones de Comisiones
CREATE TABLE IF NOT EXISTS `commission_settlements` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `total_paid_sales_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `orders_count` INT NOT NULL DEFAULT 0,
  `total_commission_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expense_id` VARCHAR(64) NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `system_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `is_bulk_fractioned` TINYINT(1) NOT NULL DEFAULT 0,
  `quantity` DECIMAL(10,3) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `notes` TEXT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Cobros / Pagos
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `receipt_number` VARCHAR(20) NOT NULL UNIQUE,
  `customer_id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NULL,
  `payment_method` ENUM('CASH', 'MERCADO_PAGO', 'TRANSFER', 'CURRENT_ACCOUNT_CREDIT') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimientos de Cuenta Corriente Cliente
CREATE TABLE IF NOT EXISTS `customer_account_movements` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NOT NULL,
  `movement_type` ENUM('DEBIT', 'CREDIT') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `balance_after` DECIMAL(12,2) NOT NULL,
  `reference_type` VARCHAR(50) NOT NULL,
  `reference_id` VARCHAR(64) NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Recepción de Mercadería y Cuentas por Pagar Proveedores
CREATE TABLE IF NOT EXISTS `merchandise_receipts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `receipt_number` VARCHAR(100) NOT NULL,
  `supplier_id` VARCHAR(64) NOT NULL,
  `receipt_type` ENUM('FACTURA', 'REMITO', 'NOTA_CREDITO') NOT NULL DEFAULT 'FACTURA',
  `issue_date` DATE NOT NULL,
  `reception_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `due_date` DATE NOT NULL,
  `payment_terms_days` INT NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `merchandise_receipt_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `receipt_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `item_type` ENUM('GRANEL', 'ELABORADO') NOT NULL DEFAULT 'ELABORADO',
  `quantity` DECIMAL(12,3) NOT NULL,
  `unit_of_measure` VARCHAR(20) NOT NULL,
  `unit_cost` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `lot_number` VARCHAR(100) NULL,
  `expiration_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`receipt_id`) REFERENCES `merchandise_receipts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `accounts_payable_payments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `receipt_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `payment_method` ENUM('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'MERCADO_PAGO', 'OTRO') NOT NULL DEFAULT 'TRANSFERENCIA',
  `reference_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`receipt_id`) REFERENCES `merchandise_receipts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Ordenes de Fraccionamiento
CREATE TABLE IF NOT EXISTS `fractioning_orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `raw_material_id` VARCHAR(64) NULL,
  `final_product_id` VARCHAR(64) NULL,
  `input_qty_kg` DECIMAL(12,3) NOT NULL,
  `target_units` DECIMAL(12,3) NOT NULL,
  `actual_output_units` DECIMAL(12,3) NOT NULL,
  `waste_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  `waste_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `waste_reason` TEXT NULL,
  `raw_material_batch` VARCHAR(100) NULL,
  `generated_batch` VARCHAR(100) NULL,
  `fractioning_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiration_date` DATE NULL,
  `operator_name` VARCHAR(150) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Tareas Operativas & Kanban
CREATE TABLE IF NOT EXISTS `operational_tasks` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  `assigned_to` VARCHAR(150) NULL,
  `order_id` VARCHAR(64) NULL,
  `product_id` VARCHAR(64) NULL,
  `product_name` VARCHAR(255) NULL,
  `quantity` DECIMAL(12,3) NULL,
  `unit_of_measure` VARCHAR(50) NULL,
  `due_date` DATE NULL,
  `completed_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Gastos Operativos y Estructura de Precios
CREATE TABLE IF NOT EXISTS `operational_expenses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `description` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `voucher_type` VARCHAR(50) NULL,
  `voucher_number` VARCHAR(100) NULL,
  `expense_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
  `supplier_id` VARCHAR(64) NULL,
  `supplier_name` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_pricing_structures` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `product_id` VARCHAR(64) NOT NULL UNIQUE,
  `product_sku` VARCHAR(50) NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `unit_of_measure` VARCHAR(20) NOT NULL DEFAULT 'unidades',
  `raw_material_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `packaging_label_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `labor_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `allocated_fixed_costs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `mostrador_commission_pct` DECIMAL(5,2) DEFAULT 0.00,
  `mostrador_margin_pct` DECIMAL(5,2) DEFAULT 35.00,
  `mostrador_suggested_price` DECIMAL(12,2) DEFAULT 0.00,
  `mostrador_final_price` DECIMAL(12,2) DEFAULT 0.00,
  `whatsapp_commission_pct` DECIMAL(5,2) DEFAULT 2.00,
  `whatsapp_margin_pct` DECIMAL(5,2) DEFAULT 30.00,
  `whatsapp_suggested_price` DECIMAL(12,2) DEFAULT 0.00,
  `whatsapp_final_price` DECIMAL(12,2) DEFAULT 0.00,
  `online_commission_pct` DECIMAL(5,2) DEFAULT 5.00,
  `online_margin_pct` DECIMAL(5,2) DEFAULT 25.00,
  `online_suggested_price` DECIMAL(12,2) DEFAULT 0.00,
  `online_final_price` DECIMAL(12,2) DEFAULT 0.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Configuración del Sistema
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key_name` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` JSON NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Marketing & Campañas WhatsApp
CREATE TABLE IF NOT EXISTS `marketing_templates` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'PROMOTION',
  `variables` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `marketing_campaigns` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `template_id` VARCHAR(64) NULL,
  `message_content` TEXT NOT NULL,
  `audience_filter` JSON NULL,
  `scheduled_at` DATETIME NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `recipient_count` INT NOT NULL DEFAULT 0,
  `sent_count` INT NOT NULL DEFAULT 0,
  `failed_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NULL,
  `type` VARCHAR(50) NOT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `message_content` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'SENT',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Configuración de Impresoras Térmicas
CREATE TABLE IF NOT EXISTS `printer_configurations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `connection_type` VARCHAR(50) NOT NULL DEFAULT 'BLUETOOTH',
  `protocol` VARCHAR(50) NOT NULL DEFAULT 'NIIMBOT_PRO',
  `label_width_mm` INT NOT NULL DEFAULT 50,
  `label_height_mm` INT NOT NULL DEFAULT 30,
  `dpi` INT NOT NULL DEFAULT 203,
  `mac_address_or_ip` VARCHAR(100) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `printer_configurations` (`id`, `name`, `model`, `connection_type`, `protocol`, `label_width_mm`, `label_height_mm`, `dpi`, `is_default`) VALUES
('prn-1', 'NIIMBOT B1 Pro (Mostrador)', 'NIIMBOT B1 Pro', 'BLUETOOTH', 'NIIMBOT_PRO', 50, 30, 203, 1);

SET FOREIGN_KEY_CHECKS = 1;
