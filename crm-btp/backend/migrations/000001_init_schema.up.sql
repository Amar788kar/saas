-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 1. COMPANIES (Tenants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    legal_form VARCHAR(50) DEFAULT 'SARL',
    nif VARCHAR(50),
    nis VARCHAR(50),
    rc VARCHAR(50),
    article_taxe VARCHAR(50),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    wilaya VARCHAR(100) NOT NULL,
    commune VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'DZD',
    plan VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER, BUSINESS, PRO
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_companies_modtime
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 2. ROLES & PERMISSIONS (RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, MANAGER, COMMERCIAL, EMPLOYEE
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- ex: users:read, quotes:write, etc.
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ==============================================================================
-- 3. USERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_company_user_email UNIQUE (company_id, email)
);

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ==============================================================================
-- 4. REFRESH TOKENS (Sessions & Rotation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ==============================================================================
-- 5. AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
    entity_name VARCHAR(50) NOT NULL, -- USER, COMPANY, ROLE, etc.
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_date ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);

-- ==============================================================================
-- SEED DATA: Roles & Permissions
-- ==============================================================================
INSERT INTO roles (id, code, name, description, is_system) VALUES
(1, 'ADMIN', 'Gérant / Administrateur', 'Accès complet à toutes les fonctionnalités et paramètres de l''entreprise', TRUE),
(2, 'MANAGER', 'Conducteur de Travaux / Manager', 'Gestion des chantiers, équipes, clients, devis et plannings', TRUE),
(3, 'COMMERCIAL', 'Commercial / Chargé d''affaires', 'Gestion des prospects, clients, devis, visites et relances', TRUE),
(4, 'EMPLOYEE', 'Artisan / Ouvrier / Technicien', 'Accès restreint aux chantiers assignés, tâches et pointages', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Permissions de base
INSERT INTO permissions (id, code, module, description) VALUES
-- Company & Users
(1, 'company:read', 'company', 'Voir les informations de l''entreprise'),
(2, 'company:write', 'company', 'Modifier les informations de l''entreprise'),
(3, 'users:read', 'users', 'Consulter la liste des collaborateurs'),
(4, 'users:write', 'users', 'Créer ou modifier des collaborateurs'),
(5, 'users:delete', 'users', 'Désactiver ou supprimer des collaborateurs'),

-- CRM
(10, 'leads:read', 'crm', 'Consulter les prospects'),
(11, 'leads:write', 'crm', 'Créer ou modifier les prospects'),
(12, 'clients:read', 'crm', 'Consulter les clients'),
(13, 'clients:write', 'crm', 'Créer ou modifier les clients'),
(14, 'visits:read', 'crm', 'Consulter les visites'),
(15, 'visits:write', 'crm', 'Planifier des visites'),

-- Ventes
(20, 'quotes:read', 'sales', 'Consulter les devis'),
(21, 'quotes:write', 'sales', 'Créer ou modifier les devis'),
(22, 'contracts:read', 'sales', 'Consulter les contrats'),
(23, 'contracts:write', 'sales', 'Créer ou modifier les contrats'),

-- Chantiers
(30, 'projects:read', 'projects', 'Consulter les chantiers'),
(31, 'projects:write', 'projects', 'Créer ou modifier les chantiers'),
(32, 'tasks:read', 'projects', 'Consulter les tâches'),
(33, 'tasks:write', 'projects', 'Créer ou modifier les tâches'),

-- Finance & Stock
(40, 'payments:read', 'finance', 'Consulter les paiements et rapports financiers'),
(41, 'payments:write', 'finance', 'Enregistrer des paiements'),
(50, 'materials:read', 'stock', 'Consulter le stock et les matériaux'),
(51, 'materials:write', 'stock', 'Gérer les stocks et mouvements')
ON CONFLICT (id) DO NOTHING;

-- Associations Roles - Permissions
-- 1. ADMIN : Toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- 2. MANAGER : Tout sauf modification entreprise et suppression d'utilisateurs
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code NOT IN ('company:write', 'users:delete')
ON CONFLICT DO NOTHING;

-- 3. COMMERCIAL : CRM, Ventes, lecture des chantiers
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE code IN (
    'company:read', 'users:read',
    'leads:read', 'leads:write', 'clients:read', 'clients:write', 'visits:read', 'visits:write',
    'quotes:read', 'quotes:write', 'contracts:read', 'contracts:write',
    'projects:read', 'tasks:read'
)
ON CONFLICT DO NOTHING;

-- 4. EMPLOYEE : Lecture chantiers assignés, mise à jour des tâches
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE code IN (
    'projects:read', 'tasks:read', 'tasks:write', 'materials:read'
)
ON CONFLICT DO NOTHING;
