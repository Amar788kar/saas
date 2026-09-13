package visits

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// VisitStatus represents the current stage of the visit
type VisitStatus string

const (
	StatusPlanifiee VisitStatus = "PLANIFIEE"
	StatusConfirmee VisitStatus = "CONFIRMEE"
	StatusTerminee  VisitStatus = "TERMINEE"
	StatusAnnulee   VisitStatus = "ANNULEE"
)

// Visit represents a CRM visit/appointment
type Visit struct {
	ID          uuid.UUID    `json:"id"`
	CompanyID   uuid.UUID    `json:"company_id"`
	ClientID    *uuid.UUID   `json:"client_id,omitempty"`
	LeadID      *uuid.UUID   `json:"lead_id,omitempty"`
	ScheduledAt time.Time    `json:"scheduled_at"`
	Address     string       `json:"address"`
	Description string       `json:"description"`
	Notes       string       `json:"notes"`
	Status      VisitStatus  `json:"status"`
	AssignedTo  *uuid.UUID   `json:"assigned_to,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// VisitRepository defines the interface for visit data access
type VisitRepository interface {
	Create(ctx context.Context, visit *Visit) error
	GetByID(ctx context.Context, companyID, id uuid.UUID) (*Visit, error)
	Update(ctx context.Context, visit *Visit) error
	Delete(ctx context.Context, companyID, id uuid.UUID) error
	List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Visit, error)
}

type postgresVisitRepository struct {
	db *sql.DB
}

// NewPostgresVisitRepository creates a new PostgreSQL visit repository
func NewPostgresVisitRepository(db *sql.DB) VisitRepository {
	return &postgresVisitRepository{db: db}
}

func (r *postgresVisitRepository) Create(ctx context.Context, visit *Visit) error {
	query := `
		INSERT INTO visits (
			company_id, client_id, lead_id, scheduled_at, address, description, notes, status, assigned_to
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		) RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		visit.CompanyID,
		visit.ClientID,
		visit.LeadID,
		visit.ScheduledAt,
		visit.Address,
		visit.Description,
		visit.Notes,
		visit.Status,
		visit.AssignedTo,
	).Scan(&visit.ID, &visit.CreatedAt, &visit.UpdatedAt)

	return err
}

func (r *postgresVisitRepository) GetByID(ctx context.Context, companyID, id uuid.UUID) (*Visit, error) {
	query := `
		SELECT id, company_id, client_id, lead_id, scheduled_at, address, description, notes, status, assigned_to, created_at, updated_at
		FROM visits
		WHERE id = $1 AND company_id = $2
	`
	
	visit := &Visit{}
	err := r.db.QueryRowContext(ctx, query, id, companyID).Scan(
		&visit.ID,
		&visit.CompanyID,
		&visit.ClientID,
		&visit.LeadID,
		&visit.ScheduledAt,
		&visit.Address,
		&visit.Description,
		&visit.Notes,
		&visit.Status,
		&visit.AssignedTo,
		&visit.CreatedAt,
		&visit.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("visit not found")
		}
		return nil, err
	}
	return visit, nil
}

func (r *postgresVisitRepository) Update(ctx context.Context, visit *Visit) error {
	query := `
		UPDATE visits
		SET client_id = $1, lead_id = $2, scheduled_at = $3, address = $4, description = $5, notes = $6, status = $7, assigned_to = $8
		WHERE id = $9 AND company_id = $10
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		visit.ClientID,
		visit.LeadID,
		visit.ScheduledAt,
		visit.Address,
		visit.Description,
		visit.Notes,
		visit.Status,
		visit.AssignedTo,
		visit.ID,
		visit.CompanyID,
	).Scan(&visit.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("visit not found or no permission")
		}
		return err
	}
	return nil
}

func (r *postgresVisitRepository) Delete(ctx context.Context, companyID, id uuid.UUID) error {
	query := `DELETE FROM visits WHERE id = $1 AND company_id = $2`
	result, err := r.db.ExecContext(ctx, query, id, companyID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("visit not found")
	}
	return nil
}

func (r *postgresVisitRepository) List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Visit, error) {
	query := `
		SELECT id, company_id, client_id, lead_id, scheduled_at, address, description, notes, status, assigned_to, created_at, updated_at
		FROM visits
		WHERE company_id = $1
		ORDER BY scheduled_at ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var visits []*Visit
	for rows.Next() {
		visit := &Visit{}
		if err := rows.Scan(
			&visit.ID,
			&visit.CompanyID,
			&visit.ClientID,
			&visit.LeadID,
			&visit.ScheduledAt,
			&visit.Address,
			&visit.Description,
			&visit.Notes,
			&visit.Status,
			&visit.AssignedTo,
			&visit.CreatedAt,
			&visit.UpdatedAt,
		); err != nil {
			return nil, err
		}
		visits = append(visits, visit)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return visits, nil
}
