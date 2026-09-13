package user

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("a user with this email already exists")
)

type Repository interface {
	GetByID(ctx context.Context, companyID, userID uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	ListByCompany(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]User, int64, error)
	Create(ctx context.Context, tx *sql.Tx, u *User) error
	Update(ctx context.Context, u *User) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	UpdateLastLogin(ctx context.Context, userID uuid.UUID) error
	GetRoleIDByCode(ctx context.Context, code string) (int, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetRoleIDByCode(ctx context.Context, code string) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, "SELECT id FROM roles WHERE code = $1", code).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *repository) GetByID(ctx context.Context, companyID, userID uuid.UUID) (*User, error) {
	query := `
		SELECT u.id, u.company_id, u.role_id, r.code, r.name, u.first_name, u.last_name,
		       u.email, u.phone, u.job_title, u.password_hash, u.status, u.avatar_url,
		       u.last_login_at, u.created_at, u.updated_at
		FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE u.id = $1 AND u.company_id = $2 AND u.deleted_at IS NULL
	`

	var u User
	err := r.db.QueryRowContext(ctx, query, userID, companyID).Scan(
		&u.ID, &u.CompanyID, &u.RoleID, &u.RoleCode, &u.RoleName, &u.FirstName, &u.LastName,
		&u.Email, &u.Phone, &u.JobTitle, &u.PasswordHash, &u.Status, &u.AvatarURL,
		&u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT u.id, u.company_id, u.role_id, r.code, r.name, u.first_name, u.last_name,
		       u.email, u.phone, u.job_title, u.password_hash, u.status, u.avatar_url,
		       u.last_login_at, u.created_at, u.updated_at
		FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL
	`

	var u User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.ID, &u.CompanyID, &u.RoleID, &u.RoleCode, &u.RoleName, &u.FirstName, &u.LastName,
		&u.Email, &u.Phone, &u.JobTitle, &u.PasswordHash, &u.Status, &u.AvatarURL,
		&u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *repository) ListByCompany(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]User, int64, error) {
	countQuery := `SELECT COUNT(*) FROM users WHERE company_id = $1 AND deleted_at IS NULL`
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, companyID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT u.id, u.company_id, u.role_id, r.code, r.name, u.first_name, u.last_name,
		       u.email, u.phone, u.job_title, u.status, u.avatar_url,
		       u.last_login_at, u.created_at, u.updated_at
		FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE u.company_id = $1 AND u.deleted_at IS NULL
		ORDER BY u.created_at ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	users := make([]User, 0)
	for rows.Next() {
		var u User
		err := rows.Scan(
			&u.ID, &u.CompanyID, &u.RoleID, &u.RoleCode, &u.RoleName, &u.FirstName, &u.LastName,
			&u.Email, &u.Phone, &u.JobTitle, &u.Status, &u.AvatarURL,
			&u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}

	return users, total, nil
}

func (r *repository) Create(ctx context.Context, tx *sql.Tx, u *User) error {
	query := `
		INSERT INTO users (id, company_id, role_id, first_name, last_name, email, phone, job_title, password_hash, status, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
		RETURNING created_at, updated_at
	`

	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.Status == "" {
		u.Status = "ACTIVE"
	}

	exec := r.db.QueryRowContext
	if tx != nil {
		exec = tx.QueryRowContext
	}

	return exec(ctx, query,
		u.ID, u.CompanyID, u.RoleID, u.FirstName, u.LastName, u.Email, u.Phone,
		u.JobTitle, u.PasswordHash, u.Status, u.AvatarURL,
	).Scan(&u.CreatedAt, &u.UpdatedAt)
}

func (r *repository) Update(ctx context.Context, u *User) error {
	query := `
		UPDATE users
		SET role_id = $1, first_name = $2, last_name = $3, phone = $4, job_title = $5,
		    status = $6, updated_at = NOW()
		WHERE id = $7 AND company_id = $8 AND deleted_at IS NULL
		RETURNING updated_at
	`

	return r.db.QueryRowContext(ctx, query,
		u.RoleID, u.FirstName, u.LastName, u.Phone, u.JobTitle, u.Status,
		u.ID, u.CompanyID,
	).Scan(&u.UpdatedAt)
}

func (r *repository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, passwordHash, userID)
	return err
}

func (r *repository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE users SET last_login_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}
