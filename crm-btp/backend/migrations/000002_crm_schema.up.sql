-- ==============================================================================
-- 1. CLIENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, COMPANY
    name VARCHAR(255) NOT NULL, -- Nom de l'entreprise ou Nom complet si particulier
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    wilaya VARCHAR(100),
    commune VARCHAR(100),
    notes TEXT,
    source VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_clients_modtime
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);

-- ==============================================================================
-- 2. CONTACTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    role VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_contacts_modtime
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);

-- ==============================================================================
-- 3. LEADS (Prospects)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NOUVEAU', -- NOUVEAU, CONTACTE, QUALIFICATION, VISITE, DEVIS, NEGOCIATION, GAGNE, PERDU
    estimated_value DECIMAL(12,2),
    expected_close_date DATE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_leads_modtime
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);

-- ==============================================================================
-- 4. VISITS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    address TEXT,
    description TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANIFIEE', -- PLANIFIEE, CONFIRMEE, TERMINEE, ANNULEE
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_visits_modtime
BEFORE UPDATE ON visits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_visits_company_date ON visits(company_id, scheduled_at);

-- ==============================================================================
-- 5. TIMELINE EVENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- CALL, EMAIL, VISIT, NOTE, STATUS_CHANGE
    description TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_client ON timeline_events(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_lead ON timeline_events(lead_id, created_at DESC);
