package clients

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// ClientType represents the type of a client (individual or company)
type ClientType string

const (
	ClientTypeIndividual ClientType = "INDIVIDUAL"
	ClientTypeCompany    ClientType = "COMPANY"
)

// Client represents a CRM client
type Client struct {
	ID        uuid.UUID    `json:"id"`
	CompanyID uuid.UUID    `json:"company_id"`
	Type      ClientType   `json:"type"`
	Name      string       `json:"name"`
	Phone     string       `json:"phone"`
	Email     string       `json:"email"`
	Address   string       `json:"address"`
	Wilaya    string       `json:"wilaya"`
	Commune   string       `json:"commune"`
	Notes     string       `json:"notes"`
	Source    string       `json:"source"`
	Status    string       `json:"status"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	DeletedAt sql.NullTime `json:"-"`
}

// ClientRepository defines the interface for client data access
type ClientRepository interface {
	Create(ctx context.Context, client *Client) error
	GetByID(ctx context.Context, companyID, id uuid.UUID) (*Client, error)
	Update(ctx context.Context, client *Client) error
	Delete(ctx context.Context, companyID, id uuid.UUID) error
	List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Client, error)
}

// postgresClientRepository implements ClientRepository for PostgreSQL
type postgresClientRepository struct {
	db *sql.DB
}

// NewPostgresClientRepository creates a new PostgreSQL client repository
func NewPostgresClientRepository(db *sql.DB) ClientRepository {
	return &postgresClientRepository{db: db}
}

func (r *postgresClientRepository) Create(ctx context.Context, client *Client) error {
	query := `
		INSERT INTO clients (
			company_id, type, name, phone, email, address, wilaya, commune, notes, source, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		client.CompanyID,
		client.Type,
		client.Name,
		client.Phone,
		client.Email,
		client.Address,
		client.Wilaya,
		client.Commune,
		client.Notes,
		client.Source,
		client.Status,
	).Scan(&client.ID, &client.CreatedAt, &client.UpdatedAt)

	return err
}

func (r *postgresClientRepository) GetByID(ctx context.Context, companyID, id uuid.UUID) (*Client, error) {
	query := `
		SELECT id, company_id, type, name, phone, email, address, wilaya, commune, notes, source, status, created_at, updated_at
		FROM clients
		WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
	`
	
	client := &Client{}
	err := r.db.QueryRowContext(ctx, query, id, companyID).Scan(
		&client.ID,
		&client.CompanyID,
		&client.Type,
		&client.Name,
		&client.Phone,
		&client.Email,
		&client.Address,
		&client.Wilaya,
		&client.Commune,
		&client.Notes,
		&client.Source,
		&client.Status,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("client not found")
		}
		return nil, err
	}
	return client, nil
}

func (r *postgresClientRepository) Update(ctx context.Context, client *Client) error {
	query := `
		UPDATE clients
		SET type = $1, name = $2, phone = $3, email = $4, address = $5, wilaya = $6, commune = $7, notes = $8, source = $9, status = $10
		WHERE id = $11 AND company_id = $12 AND deleted_at IS NULL
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		client.Type,
		client.Name,
		client.Phone,
		client.Email,
		client.Address,
		client.Wilaya,
		client.Commune,
		client.Notes,
		client.Source,
		client.Status,
		client.ID,
		client.CompanyID,
	).Scan(&client.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("client not found or no permission")
		}
		return err
	}
	return nil
}

func (r *postgresClientRepository) Delete(ctx context.Context, companyID, id uuid.UUID) error {
	query := `
		UPDATE clients
		SET deleted_at = NOW()
		WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
	`
	result, err := r.db.ExecContext(ctx, query, id, companyID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("client not found")
	}

	return nil
}

func (r *postgresClientRepository) List(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Client, error) {
	query := `
		SELECT id, company_id, type, name, phone, email, address, wilaya, commune, notes, source, status, created_at, updated_at
		FROM clients
		WHERE company_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []*Client
	for rows.Next() {
		client := &Client{}
		if err := rows.Scan(
			&client.ID,
			&client.CompanyID,
			&client.Type,
			&client.Name,
			&client.Phone,
			&client.Email,
			&client.Address,
			&client.Wilaya,
			&client.Commune,
			&client.Notes,
			&client.Source,
			&client.Status,
			&client.CreatedAt,
			&client.UpdatedAt,
		); err != nil {
			return nil, err
		}
		clients = append(clients, client)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return clients, nil
}
