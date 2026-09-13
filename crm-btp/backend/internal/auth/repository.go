package auth

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrSessionNotFound = errors.New("refresh token session not found")
)

type Repository interface {
	SaveRefreshToken(ctx context.Context, session *RefreshTokenSession) error
	GetRefreshToken(ctx context.Context, tokenHash string) (*RefreshTokenSession, error)
	RevokeRefreshToken(ctx context.Context, tokenHash string) error
	RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) SaveRefreshToken(ctx context.Context, session *RefreshTokenSession) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, company_id, token_hash, ip_address, user_agent, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
	`

	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}

	_, err := r.db.ExecContext(ctx, query,
		session.ID, session.UserID, session.CompanyID, session.TokenHash,
		session.IPAddress, session.UserAgent, session.ExpiresAt,
	)
	return err
}

func (r *repository) GetRefreshToken(ctx context.Context, tokenHash string) (*RefreshTokenSession, error) {
	query := `
		SELECT id, user_id, company_id, token_hash, ip_address, user_agent, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`

	var s RefreshTokenSession
	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&s.ID, &s.UserID, &s.CompanyID, &s.TokenHash, &s.IPAddress, &s.UserAgent,
		&s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}

	return &s, nil
}

func (r *repository) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	query := `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, tokenHash)
	return err
}

func (r *repository) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}
