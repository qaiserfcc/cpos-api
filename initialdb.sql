-- CPOS-API Initial Database Schema
-- This file contains the initial database schema for the Cloud Point of Sale system
-- Compatible with Neon PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    loyalty_points INTEGER DEFAULT 0,
    total_purchases DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    location VARCHAR(100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, location)
);

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_status_id UUID REFERENCES payment_statuses(id),
    sale_status_id UUID REFERENCES sale_statuses(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for product categorization
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles table for user roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table for access control
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE, -- e.g., 'products:create'
    resource VARCHAR(100) NOT NULL, -- e.g., 'products'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment statuses table
CREATE TABLE payment_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale statuses table
CREATE TABLE sale_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_sale_status_id ON sales(sale_status_id);
CREATE INDEX idx_sales_payment_method_id ON sales(payment_method_id);
CREATE INDEX idx_sales_payment_status_id ON sales(payment_status_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update inventory after sale
CREATE OR REPLACE FUNCTION update_inventory_after_sale()
RETURNS TRIGGER AS $$
DECLARE
    old_status_name VARCHAR(50);
    new_status_name VARCHAR(50);
BEGIN
    -- Get status names
    SELECT name INTO old_status_name FROM sale_statuses WHERE id = OLD.sale_status_id;
    SELECT name INTO new_status_name FROM sale_statuses WHERE id = NEW.sale_status_id;

    -- Decrease inventory when sale is completed
    IF new_status_name = 'completed' AND (old_status_name IS NULL OR old_status_name != 'completed') THEN
        UPDATE inventory
        SET quantity = quantity - (
            SELECT SUM(quantity)
            FROM sale_items
            WHERE sale_id = NEW.id
            AND product_id = inventory.product_id
        )
        WHERE product_id IN (
            SELECT product_id FROM sale_items WHERE sale_id = NEW.id
        );
    END IF;

    -- Restore inventory when sale is cancelled
    IF new_status_name = 'cancelled' AND old_status_name = 'completed' THEN
        UPDATE inventory
        SET quantity = quantity + (
            SELECT SUM(quantity)
            FROM sale_items
            WHERE sale_id = NEW.id
            AND product_id = inventory.product_id
        )
        WHERE product_id IN (
            SELECT product_id FROM sale_items WHERE sale_id = NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_after_sale
    AFTER UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_after_sale();

-- Function to update customer total purchases
CREATE OR REPLACE FUNCTION update_customer_total_purchases()
RETURNS TRIGGER AS $$
DECLARE
    old_status_name VARCHAR(50);
    new_status_name VARCHAR(50);
BEGIN
    -- Get status names
    SELECT name INTO old_status_name FROM sale_statuses WHERE id = OLD.sale_status_id;
    SELECT name INTO new_status_name FROM sale_statuses WHERE id = NEW.sale_status_id;

    IF new_status_name = 'completed' AND (old_status_name IS NULL OR old_status_name != 'completed') THEN
        UPDATE customers
        SET total_purchases = total_purchases + NEW.total_amount
        WHERE id = NEW.customer_id;
    END IF;

    IF new_status_name = 'cancelled' AND old_status_name = 'completed' THEN
        UPDATE customers
        SET total_purchases = GREATEST(total_purchases - NEW.total_amount, 0)
        WHERE id = NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_total_purchases
    AFTER UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_total_purchases();

-- Seed data for roles
INSERT INTO roles (name, description) VALUES
('superadmin', 'Super Admin');

-- Seed data for permissions
INSERT INTO permissions (name, resource, action) VALUES
-- Users permissions
('users:create', 'users', 'create'),
('users:read', 'users', 'read'),
('users:update', 'users', 'update'),
('users:delete', 'users', 'delete'),
-- Customers permissions
('customers:create', 'customers', 'create'),
('customers:read', 'customers', 'read'),
('customers:update', 'customers', 'update'),
('customers:delete', 'customers', 'delete'),
-- Products permissions
('products:create', 'products', 'create'),
('products:read', 'products', 'read'),
('products:update', 'products', 'update'),
('products:delete', 'products', 'delete'),
-- Inventory permissions
('inventory:create', 'inventory', 'create'),
('inventory:read', 'inventory', 'read'),
('inventory:update', 'inventory', 'update'),
('inventory:delete', 'inventory', 'delete'),
-- Sales permissions
('sales:create', 'sales', 'create'),
('sales:read', 'sales', 'read'),
('sales:update', 'sales', 'update'),
('sales:delete', 'sales', 'delete'),
-- Sale items permissions
('sale_items:create', 'sale_items', 'create'),
('sale_items:read', 'sale_items', 'read'),
('sale_items:update', 'sale_items', 'update'),
('sale_items:delete', 'sale_items', 'delete'),
-- Categories permissions
('categories:create', 'categories', 'create'),
('categories:read', 'categories', 'read'),
('categories:update', 'categories', 'update'),
('categories:delete', 'categories', 'delete'),
-- Roles permissions
('roles:create', 'roles', 'create'),
('roles:read', 'roles', 'read'),
('roles:update', 'roles', 'update'),
('roles:delete', 'roles', 'delete'),
-- Permissions permissions
('permissions:create', 'permissions', 'create'),
('permissions:read', 'permissions', 'read'),
('permissions:update', 'permissions', 'update'),
('permissions:delete', 'permissions', 'delete');

-- Seed data for payment methods
INSERT INTO payment_methods (name) VALUES
('cash'),
('card'),
('check'),
('other');

-- Seed data for payment statuses
INSERT INTO payment_statuses (name) VALUES
('pending'),
('paid'),
('refunded'),
('cancelled');

-- Seed data for sale statuses
INSERT INTO sale_statuses (name) VALUES
('pending'),
('completed'),
('cancelled'),
('refunded');

-- Assign all permissions to superadmin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin';

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE customers IS 'Customer information and loyalty data';
COMMENT ON TABLE products IS 'Product catalog with pricing and details';
COMMENT ON TABLE inventory IS 'Stock levels and inventory management';
COMMENT ON TABLE sales IS 'Sales transactions and order information';
COMMENT ON TABLE sale_items IS 'Individual items within sales transactions';
COMMENT ON TABLE categories IS 'Product categories for organization';
COMMENT ON TABLE roles IS 'User roles for access control';
COMMENT ON TABLE permissions IS 'Permissions for fine-grained access control';
COMMENT ON TABLE user_roles IS 'Junction table linking users to roles';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE payment_methods IS 'Available payment methods';
COMMENT ON TABLE payment_statuses IS 'Payment status options';
COMMENT ON TABLE sale_statuses IS 'Sale status options';