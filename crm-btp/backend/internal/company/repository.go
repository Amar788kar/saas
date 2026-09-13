package company

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrCompanyNotFound = errors.New("company not found")
)

type Repository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*Company, error)
	Create(ctx context.Context, tx *sql.Tx, c *Company) error
	Update(ctx context.Context, c *Company) error
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Company, error) {
	query := `
		SELECT id, name, trade_name, legal_form, nif, nis, rc, article_taxe, phone, email,
		       address, wilaya, commune, currency, plan, status, settings, created_at, updated_at
		FROM companies
		WHERE id = $1 AND deleted_at IS NULL
	`

	var c Company
	var settings []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.Name, &c.TradeName, &c.LegalForm, &c.NIF, &c.NIS, &c.RC, &c.ArticleTaxe,
		&c.Phone, &c.Email, &c.Address, &c.Wilaya, &c.Commune, &c.Currency, &c.Plan,
		&c.Status, &settings, &c.CreatedAt, &c.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCompanyNotFound
		}
		return nil, err
	}

	c.Settings = settings
	return &c, nil
}

func (r *repository) Create(ctx context.Context, tx *sql.Tx, c *Company) error {
	query := `
		INSERT INTO companies (id, name, trade_name, legal_form, nif, nis, rc, article_taxe, phone, email, address, wilaya, commune, currency, plan, status, settings, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
		RETURNING created_at, updated_at
	`

	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.Currency == "" {
		c.Currency = "DZD"
	}
	if c.Plan == "" {
		c.Plan = "STARTER"
	}
	if c.Status == "" {
		c.Status = "ACTIVE"
	}
	if len(c.Settings) == 0 {
		c.Settings = []byte("{}")
	}

	exec := r.db.QueryRowContext
	if tx != nil {
		exec = tx.QueryRowContext
	}

	return exec(ctx, query,
		c.ID, c.Name, c.TradeName, c.LegalForm, c.NIF, c.NIS, c.RC, c.ArticleTaxe,
		c.Phone, c.Email, c.Address, c.Wilaya, c.Commune, c.Currency, c.Plan, c.Status,
		c.Settings,
	).Scan(&c.CreatedAt, &c.UpdatedAt)
}

func (r *repository) Update(ctx context.Context, c *Company) error {
	query := `
		UPDATE companies
		SET name = $1, trade_name = $2, legal_form = $3, nif = $4, nis = $5, rc = $6, article_taxe = $7,
		    phone = $8, email = $9, address = $10, wilaya = $11, commune = $12, updated_at = NOW()
		WHERE id = $13 AND deleted_at IS NULL
		RETURNING updated_at
	`

	return r.db.QueryRowContext(ctx, query,
		c.Name, c.TradeName, c.LegalForm, c.NIF, c.NIS, c.RC, c.ArticleTaxe,
		c.Phone, c.Email, c.Address, c.Wilaya, c.Commune, c.ID,
	).Scan(&c.UpdatedAt)
}
