package leads

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// LeadStatus represents the current stage of the lead
type LeadStatus string

const (
	StatusNouveau       LeadStatus = "NOUVEAU"
	StatusContacte      LeadStatus = "CONTACTE"
	StatusQualification LeadStatus = "QUALIFICATION"
	StatusVisite        LeadStatus = "VISITE"
	StatusDevis         LeadStatus = "DEVIS"
	StatusNegociation   LeadStatus = "NEGOCIATION"
	StatusGagne         LeadStatus = "GAGNE"
	StatusPerdu         LeadStatus = "PERDU"
)

// Lead represents a CRM lead/prospect
type Lead struct {
	ID                uuid.UUID    `json:"id"`
	CompanyID         uuid.UUID    `json:"company_id"`
	ClientID          *uuid.UUID   `json:"client_id,omitempty"` // Nullable
	Title             string       `json:"title"`
	Status            LeadStatus   `json:"status"`
	EstimatedValue    *float64     `json:"estimated_value,omitempty"`
	ExpectedCloseDate *time.Time   `json:"expected_close_date,omitempty"`
	AssignedTo        *uuid.UUID   `json:"assigned_to,omitempty"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// LeadRepository defines the interface for lead data access
type LeadRepository interface {
	Create(ctx context.Context, lead *Lead) error
	GetByID(ctx context.Context, companyID, id uuid.UUID) (*Lead, error)
	Update(ctx context.Context, lead *Lead) error
	Delete(ctx context.Context, companyID, id uuid.UUID) error
	List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Lead, error)
	UpdateStatus(ctx context.Context, companyID, id uuid.UUID, status LeadStatus) error
}

type postgresLeadRepository struct {
	db *sql.DB
}

// NewPostgresLeadRepository creates a new PostgreSQL lead repository
func NewPostgresLeadRepository(db *sql.DB) LeadRepository {
	return &postgresLeadRepository{db: db}
}

func (r *postgresLeadRepository) Create(ctx context.Context, lead *Lead) error {
	query := `
		INSERT INTO leads (
			company_id, client_id, title, status, estimated_value, expected_close_date, assigned_to
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		) RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		lead.CompanyID,
		lead.ClientID,
		lead.Title,
		lead.Status,
		lead.EstimatedValue,
		lead.ExpectedCloseDate,
		lead.AssignedTo,
	).Scan(&lead.ID, &lead.CreatedAt, &lead.UpdatedAt)

	return err
}

func (r *postgresLeadRepository) GetByID(ctx context.Context, companyID, id uuid.UUID) (*Lead, error) {
	query := `
		SELECT id, company_id, client_id, title, status, estimated_value, expected_close_date, assigned_to, created_at, updated_at
		FROM leads
		WHERE id = $1 AND company_id = $2
	`
	
	lead := &Lead{}
	err := r.db.QueryRowContext(ctx, query, id, companyID).Scan(
		&lead.ID,
		&lead.CompanyID,
		&lead.ClientID,
		&lead.Title,
		&lead.Status,
		&lead.EstimatedValue,
		&lead.ExpectedCloseDate,
		&lead.AssignedTo,
		&lead.CreatedAt,
		&lead.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("lead not found")
		}
		return nil, err
	}
	return lead, nil
}

func (r *postgresLeadRepository) Update(ctx context.Context, lead *Lead) error {
	query := `
		UPDATE leads
		SET client_id = $1, title = $2, estimated_value = $3, expected_close_date = $4, assigned_to = $5
		WHERE id = $6 AND company_id = $7
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		lead.ClientID,
		lead.Title,
		lead.EstimatedValue,
		lead.ExpectedCloseDate,
		lead.AssignedTo,
		lead.ID,
		lead.CompanyID,
	).Scan(&lead.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("lead not found or no permission")
		}
		return err
	}
	return nil
}

func (r *postgresLeadRepository) UpdateStatus(ctx context.Context, companyID, id uuid.UUID, status LeadStatus) error {
	query := `
		UPDATE leads
		SET status = $1
		WHERE id = $2 AND company_id = $3
	`
	result, err := r.db.ExecContext(ctx, query, status, id, companyID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("lead not found")
	}
	return nil
}

func (r *postgresLeadRepository) Delete(ctx context.Context, companyID, id uuid.UUID) error {
	query := `DELETE FROM leads WHERE id = $1 AND company_id = $2`
	result, err := r.db.ExecContext(ctx, query, id, companyID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("lead not found")
	}
	return nil
}

func (r *postgresLeadRepository) List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Lead, error) {
	query := `
		SELECT id, company_id, client_id, title, status, estimated_value, expected_close_date, assigned_to, created_at, updated_at
		FROM leads
		WHERE company_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leads []*Lead
	for rows.Next() {
		lead := &Lead{}
		if err := rows.Scan(
			&lead.ID,
			&lead.CompanyID,
			&lead.ClientID,
			&lead.Title,
			&lead.Status,
			&lead.EstimatedValue,
			&lead.ExpectedCloseDate,
			&lead.AssignedTo,
			&lead.CreatedAt,
			&lead.UpdatedAt,
		); err != nil {
			return nil, err
		}
		leads = append(leads, lead)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return leads, nil
}
